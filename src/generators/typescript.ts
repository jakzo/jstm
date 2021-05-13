import path from "path";

import { getPackages } from "@manypkg/get-packages";
import * as fse from "fs-extra";
import * as goldenFleece from "golden-fleece";
import { PackageJson } from "type-fest";

import { Config } from "../config";
import type { ContentsVars, TemplateFile, TemplateGenerator } from "../types";
import { asyncMap, mergeJsonFile } from "../utils";
import { getSubpackageDirname } from "./manifest";
import {
  getDistDir,
  getIsMonorepo,
  getNodeMinVersion,
  getSrcDir,
} from "./utils/config";

export const getMonorepoTsconfigs = async (
  config: Config,
  packageJson: PackageJson,
  rootDir = process.cwd()
): Promise<TemplateFile[]> => {
  const subpackageDirName = await getSubpackageDirname(config, packageJson);

  // jstm can run before the root package.json has been created
  if (!(await fse.pathExists(path.join(rootDir, "package.json"))))
    return subpackageDirName
      ? [
          {
            path: ["packages", subpackageDirName, "tsconfig.json"],
            isCheckedIn: true,
            doNotOverwrite: true,
            contents: `
{
  "extends": "../../tsconfig.json",
  "include": ["./src/**/*", "./src/**/*.json"],
  "exclude": ["**/__*__/**/*"],
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["node"]
  },
  "references": []
}
`,
          },
        ]
      : [];

  const { packages } = await getPackages(rootDir);
  const packageMap = new Map(
    packages
      .map((pkg) => [(pkg.packageJson as PackageJson).name, pkg.dir])
      .filter((entry): entry is [string, string] => entry[0] !== undefined)
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
        const packageJson = pkg.packageJson as PackageJson;
        return {
          path: [
            ...path.relative(rootDir, pkg.dir).split(path.sep),
            "tsconfig.json",
          ],
          contents: goldenFleece.patch(tsconfigContents, {
            ...goldenFleece.evaluate(tsconfigContents),
            references: [
              packageJson.dependencies,
              packageJson.devDependencies,
              packageJson.peerDependencies,
            ].flatMap((deps) =>
              Object.keys(deps || {})
                .map((dep) => packageMap.get(dep))
                .filter((dir): dir is string => dir !== undefined)
                .map((dir) => ({ path: path.relative(pkg.dir, dir) }))
            ),
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
    "node-notifier",
    "@types/node",
    "@types/jest",
  ],
  files: async ({ config, packageJson }) => {
    const isMonorepo = await getIsMonorepo(config);
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeMinVersion = await getNodeMinVersion(config);

    const tsconfigEntries = isMonorepo
      ? await getMonorepoTsconfigs(config, packageJson)
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
    "strictPropertyInitialization": false
  }
}
`,
      },
    ];
  },
};
