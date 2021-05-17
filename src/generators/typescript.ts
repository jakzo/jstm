import path from "path";

import { Package, getPackages } from "@manypkg/get-packages";
import * as fse from "fs-extra";
import * as goldenFleece from "golden-fleece";
import { PackageJson, TsConfigJson } from "type-fest";

import { Config } from "../config";
import type { ContentsVars, TemplateFile, TemplateGenerator } from "../types";
import { asyncMap, mergeJsonFile, readFileOr } from "../utils";
import { getSubpackageDirname } from "./manifest";
import {
  getDistDir,
  getIsMonorepo,
  getNodeMinVersion,
  getSrcDir,
} from "./utils/config";

const getMonorepoPackages = async (
  rootDir: string,
  distDir: string
): Promise<(Package & { srcDirs: string[] })[]> => {
  const { packages } = await getPackages(rootDir);
  return asyncMap(packages, async (pkg) => {
    const tsconfig = JSON.parse(
      (await readFileOr(path.join(pkg.dir, "tsconfig.json"), undefined)) || "{}"
    ) as TsConfigJson;
    const { main } = pkg.packageJson as PackageJson;
    const { compilerOptions: { rootDir = undefined, rootDirs = [] } = {} } =
      tsconfig || {};
    return {
      ...pkg,
      srcDirs: [
        ...new Set(
          [
            typeof main === "string" && !main.includes(distDir)
              ? path.resolve(pkg.dir, main)
              : undefined,
            rootDir ? path.resolve(pkg.dir, rootDir) : undefined,
            ...rootDirs.map((dir) => path.resolve(pkg.dir, dir)),
          ].filter((x): x is string => x !== undefined)
        ),
      ],
    };
  });
};

export const getMonorepoTsconfigs = async (
  config: Config,
  packageJson: PackageJson,
  isPackageJsonPresent: boolean,
  packages: Package[],
  rootDir: string
): Promise<TemplateFile[]> => {
  const subpackageDirName = await getSubpackageDirname(config, packageJson);
  const srcDir = await getSrcDir(config);
  const distDir = await getDistDir(config);

  // jstm can run before the root package.json has been created
  if (!isPackageJsonPresent)
    return subpackageDirName
      ? [
          {
            path: ["packages", subpackageDirName, "tsconfig.json"],
            isCheckedIn: true,
            doNotOverwrite: true,
            contents: `
{
  "extends": "../../tsconfig.json",
  "include": ["./${srcDir}/**/*", "./${srcDir}/**/*.json"],
  "exclude": ["**/__*__/**/*"],
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./${srcDir}",
    "outDir": "./${distDir}",
    "types": ["node"]
  },
  "references": []
}
`,
          },
        ]
      : [];

  const packageMap = new Map(
    packages
      .map((pkg) => [(pkg.packageJson as PackageJson).name, pkg])
      .filter((entry): entry is [string, Package] => entry[0] !== undefined)
  );
  return (
    await asyncMap(
      [
        ...packages,
        ...(subpackageDirName
          ? [
              {
                dir: path.join(rootDir, "packages", subpackageDirName),
                packageJson: {},
              },
            ]
          : []),
      ],
      async (pkg): Promise<TemplateFile | undefined> => {
        const tsconfigPath = path.join(pkg.dir, "tsconfig.json");
        if (!(await fse.pathExists(tsconfigPath))) return undefined;
        const tsconfigContents = await fse.readFile(tsconfigPath, "utf8");
        const tsconfig = goldenFleece.evaluate(
          tsconfigContents
        ) as TsConfigJson;
        const packageJson = pkg.packageJson as PackageJson;
        const workspaceDeps = [
          packageJson.dependencies,
          packageJson.devDependencies,
          packageJson.peerDependencies,
        ].flatMap((deps) =>
          Object.keys(deps || {})
            .map((dep) => packageMap.get(dep))
            .filter((pkg): pkg is Package => pkg !== undefined)
        );
        return {
          path: [
            ...path.relative(rootDir, pkg.dir).split(path.sep),
            "tsconfig.json",
          ],
          isCheckedIn: true,
          contents: goldenFleece.patch(tsconfigContents, {
            ...tsconfig,
            compilerOptions: {
              ...tsconfig?.compilerOptions,
              paths: {
                ...tsconfig?.compilerOptions?.paths,
                ...(Object.fromEntries(
                  workspaceDeps.map((dep) => [
                    (dep.packageJson as PackageJson).name!,
                    [path.relative(pkg.dir, path.join(dep.dir, srcDir))],
                  ])
                ) as Record<string, string[]>),
              },
            },
            references: workspaceDeps.map((dep) => ({
              path: path.relative(pkg.dir, dep.dir),
            })),
          }),
        };
      }
    )
  ).filter((x): x is TemplateFile => x !== undefined);
};

export const typescript: TemplateGenerator = {
  devDependencies: [
    "typescript",
    "ts-node",
    "ts-node-dev",
    "tsconfig-paths",
    "node-notifier",
    "@types/node",
    "@types/jest",
  ],
  files: async ({ config, packageJson }) => {
    const rootDir = process.cwd();

    const isMonorepo = await getIsMonorepo(config);
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeMinVersion = await getNodeMinVersion(config);

    const isPackageJsonPresent = await fse.pathExists(
      path.join(rootDir, "package.json")
    );
    const packages =
      isMonorepo && isPackageJsonPresent
        ? await getMonorepoPackages(rootDir, distDir)
        : [];
    const tsconfigEntries = isMonorepo
      ? await getMonorepoTsconfigs(
          config,
          packageJson,
          isPackageJsonPresent,
          packages,
          rootDir
        )
      : [];

    const targetEsVersion =
      nodeMinVersion < 6
        ? "ES6"
        : // node's semi-annual releases have been mostly compatible with the corresponding
          // yearly ECMAScript spec update since ES2015 and fully compatible since ES2019
          // https://node.green/#ES2019
          `ES${
            2015 +
            Math.floor((nodeMinVersion - 4 - (nodeMinVersion < 12 ? 1 : 0)) / 2)
          }`;
    return [
      ...tsconfigEntries,
      {
        path: ["tsconfig.json"],
        isCheckedIn: true,
        contents: await mergeJsonFile(
          "tsconfig.json",
          {
            extends: "./tsconfig.base.json",
          },
          true
        ),
      },
      isMonorepo
        ? {
            path: ["tsconfig.build.json"],
            contents: async ({ files }: ContentsVars) => `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./tsconfig.json instead)
{
  "include": [],
  "references": ${JSON.stringify(
    [
      ...new Set([
        ...tsconfigEntries.map((file) => path.join(...file.path.slice(0, -1))),
        ...files
          .flatMap((file) =>
            file.path[0] === "packages" && file.path[2] === "tsconfig.json"
              ? [path.join(...file.path.slice(0, -1))]
              : []
          )
          .filter((x) => x),
      ]),
    ].map((subpackagePath) => ({ path: subpackagePath }))
  )}
}
        `,
          }
        : {
            path: ["tsconfig.build.json"],
            contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./tsconfig.json instead)
{
  "extends": "./tsconfig.json",
  "include": ["./${srcDir}/**/*", "./${srcDir}/**/*.json"],
  "exclude": ["**/__*__/**/*"],
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./${srcDir}",
    "outDir": "./${distDir}",
    "types": ["node"]
  }
}
`,
          },
      {
        path: ["tsconfig.base.json"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./tsconfig.json instead)
{
  "include": ["**/*", "**/*.json"],
  "exclude": [
    "**/${distDir}/**/*",
    "**/node_modules/**/*",
    "**/.git/**/*",
    "**/.*cache/**/*",
    "**/.jest/**/*",
    "**/.yarn/**/*",
    "**/.coverage/**/*",
    "./.pnp.*"
  ],
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "./",
    "baseUrl": "./",
    "target": "${targetEsVersion}",
    "module": "commonjs",
    "lib": ["${targetEsVersion}"],
    "types": ["node", "jest"],
    "jsx": "react",
    "allowJs": true,
    "resolveJsonModule": true,
    "composite": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "importHelpers": true,
    "removeComments": false,
    "stripInternal": false,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strict": true,
    "noImplicitAny": true,
    "allowUnreachableCode": true,
    "allowUnusedLabels": false,
    "alwaysStrict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": false,
    "strictFunctionTypes": false,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,

    "paths": ${JSON.stringify(
      Object.fromEntries(
        packages.map((pkg) => [
          (pkg.packageJson as PackageJson).name!,
          pkg.srcDirs.map((dir) => path.relative(rootDir, dir)),
        ])
      )
    )}
  }
}
`,
      },
    ];
  },
};
