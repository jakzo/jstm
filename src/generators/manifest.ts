import path from "path";

import { PackageJson } from "type-fest";

import { Config } from "../config";
import type { TemplateGenerator, Vars } from "../types";
import { CORE_PACKAGE_NAME, readFileOr } from "../utils";
import {
  getDescription,
  getDistDir,
  getIsMonorepo,
  getLicense,
  getNodeMinVersion,
  getNpmAccess,
  getNpmRegistry,
  getPackageJsonAuthor,
  getPackageName,
  getRepoUrl,
  getSrcDir,
  getSubpackageDescription,
  getSubpackageName,
} from "./utils/config";

interface PackageScriptBuilder<C extends string> {
  add: <K extends string>(
    func: (
      commands: Record<C, string>
    ) => [K extends C ? "KeyAlreadyExists" : K, string]
  ) => PackageScriptBuilder<C | K>;
  entries: () => [string, string][];
  has: (key: string) => boolean;
}

export const getSubpackageDirname = async (
  config: Config,
  unmodifiedPackageJson: PackageJson,
  modifiedPackageJson = unmodifiedPackageJson
): Promise<string | undefined> => {
  const isMonorepo = await getIsMonorepo(config);
  if (!isMonorepo || unmodifiedPackageJson.workspaces) return undefined;
  const packageName = await getPackageName(
    config,
    modifiedPackageJson,
    isMonorepo
  );
  const subpackageName = await getSubpackageName(config, packageName);
  const rootNamePrefix =
    packageName.replace(/\/.+/, "") + (packageName.startsWith("@") ? "/" : "-");
  return (
    subpackageName.startsWith(rootNamePrefix)
      ? subpackageName.substring(rootNamePrefix.length)
      : subpackageName
  )
    .replace(/@/g, "")
    .replace(/\//g, "-");
};

export const manifest: TemplateGenerator = {
  devDependencies: ["jest", "ts-jest", "@types/jest", "rimraf"],
  files: async ({
    config,
    packageJson,
    presetPackageJson,
    devDependencies,
  }) => {
    const isMonorepo = await getIsMonorepo(config);
    const srcDir = await getSrcDir(config);
    const modifiedPackageJson = await modifyPackageJson({
      config,
      packageJson,
      presetPackageJson,
      devDependencies,
    });
    const packageJsonEntry = {
      path: ["package.json"],
      isCheckedIn: true,
      contents: JSON.stringify(modifiedPackageJson, null, 2),
    };

    if (!isMonorepo)
      return [
        packageJsonEntry,
        {
          path: [srcDir, "index.ts"],
          isCheckedIn: true,
          doNotOverwrite: true,
          contents: "",
        },
      ];

    const dirName = await getSubpackageDirname(
      config,
      packageJson,
      modifiedPackageJson
    );
    if (!dirName) return [packageJsonEntry];

    const pathParts = ["packages", dirName, "package.json"];
    const subpackageJson = await modifyPackageJson({
      config,
      packageJson: JSON.parse(
        await readFileOr(path.join(...pathParts), "{}")
      ) as PackageJson,
      presetPackageJson: {},
      devDependencies,
      monorepoPackageJson: modifiedPackageJson,
      subpackagePath: path.join(...pathParts.slice(0, -1)),
    });
    return [
      packageJsonEntry,
      {
        path: pathParts,
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: JSON.stringify(subpackageJson, null, 2),
      },
      {
        path: ["packages", dirName, srcDir, "index.ts"],
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: "",
      },
    ];
  },
};

export const modifyPackageJson = async ({
  config,
  packageJson,
  presetPackageJson,
  devDependencies,
  monorepoPackageJson,
  subpackagePath,
}: Pick<
  Vars,
  "config" | "packageJson" | "presetPackageJson" | "devDependencies"
> & {
  monorepoPackageJson?: PackageJson;
  subpackagePath?: string;
}): Promise<PackageJson> => {
  const isMonorepo = await getIsMonorepo(config);
  const packageName = !monorepoPackageJson
    ? await getPackageName(config, packageJson, isMonorepo)
    : await getSubpackageName(config, monorepoPackageJson.name!);
  const description = !monorepoPackageJson
    ? await getDescription(config, packageJson)
    : await getSubpackageDescription(config, packageJson);
  const distDir = await getDistDir(config);
  const nodeMinVersion = await getNodeMinVersion(config);
  const npmRegistry = await getNpmRegistry(config);
  const npmAccess = await getNpmAccess(config);

  const scriptEntries = Object.entries(packageJson.scripts || {});
  const getGeneratedScriptIndexes = (): [number, number] => {
    const generatedScriptStart = scriptEntries.findIndex(([key]) =>
      /^\s*=== Generated Scripts/i.test(key)
    );
    if (generatedScriptStart === -1) return [0, 0];
    const generatedScriptEnd =
      generatedScriptStart +
      2 +
      scriptEntries
        .slice(generatedScriptStart + 1)
        .findIndex(([key]) => /^\s*===/.test(key));
    return [
      generatedScriptStart,
      generatedScriptEnd +
        (scriptEntries[generatedScriptEnd]?.[0] === "" ? 1 : 0),
    ];
  };
  const [generateScriptStart, generatedScriptEnd] = getGeneratedScriptIndexes();

  const packageScriptBuilder = (): PackageScriptBuilder<never> => {
    const scripts: Record<string, string> = {};
    const builder: PackageScriptBuilder<never> = {
      add: (func) => {
        const [name, command] = func(scripts);
        scripts[name] = command;
        return builder as PackageScriptBuilder<string>;
      },
      entries: () =>
        Object.entries(scripts).map(([name, command]) => [
          name,
          `project && ${command}`,
        ]),
      has: (key) => Object.prototype.hasOwnProperty.call(scripts, key),
    };
    return builder;
  };

  const generatedScripts = packageScriptBuilder()
    .add(() => ["lint:eslint", "eslint --cache --ext js,jsx,ts,tsx ./"])
    .add(() => ["lint:prettier", 'prettier -c "./**/*{.json,.md}"'])
    .add((c) => [
      "lint:fix",
      `${c["lint:eslint"]} --fix && ${c["lint:prettier"]} --write && run-if-script-exists lint:fix:custom`,
    ])
    .add((c) => [
      "lint",
      `${c["lint:eslint"]} && ${c["lint:prettier"]} && run-if-script-exists lint:custom`,
    ])
    .add(() => [
      "build:clean",
      `rimraf "./${distDir}" "*.tsbuildinfo" && run-if-script-exists build:clean:custom`,
    ])
    .add(() => [
      "build:typescript",
      `tsc ${isMonorepo ? "-b" : "-p"} ./tsconfig.build.json`,
    ])
    .add((c) => ["build:watch", `${c["build:typescript"]} -w`])
    .add((c) => [
      "build",
      `run-if-script-exists build:custom-before && ${c["build:typescript"]} && run-if-script-exists build:custom`,
    ])
    .add(() => ["test:jest", "jest --passWithNoTests"])
    .add((c) => ["test:watch", `${c["test:jest"]} --watch`])
    .add((c) => [
      "test",
      `${c["test:jest"]} && run-if-script-exists test:custom`,
    ])
    .add((c) => [
      "test:typecheck",
      `tsc -p ./tsconfig.json --noEmit && ${c["build:typescript"]}${
        // There is no `--noEmit` flag for TypeScript build mode so we have to actually output the
        // build files to typecheck them in a monorepo
        isMonorepo ? "" : " --noEmit"
      }`,
    ])
    .add((c) => [
      "test:all",
      `${c["test:typecheck"]} && ${c.lint} && ${c.test}`,
    ])
    .add((c) => [
      "release",
      `${c["build:clean"]} && ${c.build} && ${
        isMonorepo
          ? // We might be able to unify these after this issue is resolved
            // https://github.com/yarnpkg/berry/issues/1510
            "yarn workspaces foreach --verbose --topological --no-private npm publish --tolerate-republish"
          : "changeset publish"
      } && run-if-script-exists release:custom`,
    ])
    .add(() => [
      "prepare",
      "husky install && run-if-script-exists prepare:custom",
    ]);
  packageJson.scripts = monorepoPackageJson
    ? packageJson.scripts
    : (Object.fromEntries([
        ["=== Generated Scripts (do not modify) ===", ""],
        ...generatedScripts.entries(),
        ["=== (end generated scripts) ===", ""],
        ["", ""],
        ...[
          ...scriptEntries.slice(0, generateScriptStart),
          ...scriptEntries.slice(generatedScriptEnd),
        ].map(([key, value]) =>
          generatedScripts.has(key) ? [`${key}:old`, value] : [key, value]
        ),
      ]) as Record<string, string>);

  const packageJsonDeps = packageJson.dependencies || {};
  const entriesAfter = [
    ["scripts", packageJson.scripts],
    ["peerDependencies", packageJson.peerDependencies],
    ["optionalDependencies", packageJson.optionalDependencies],
    [
      "dependencies",
      monorepoPackageJson
        ? packageJson.dependencies
        : Object.fromEntries(
            Object.entries(packageJsonDeps).map(([name, version]) => [
              name,
              // Use jstm's version if a required dev dependency is already in dependencies
              Object.prototype.hasOwnProperty.call(devDependencies, name)
                ? devDependencies[name]
                : version,
            ])
          ),
    ],
    [
      "devDependencies",
      {
        ...packageJson.devDependencies,
        // TODO: maybe we can avoid adding all these dependencies by using resolutions in the .yarnrc.yml file?
        ...Object.fromEntries(
          Object.entries(devDependencies).filter(([key]) =>
            monorepoPackageJson
              ? ["@types/node"].includes(key)
              : !Object.prototype.hasOwnProperty.call(packageJsonDeps, key)
          )
        ),
        ...(!monorepoPackageJson && presetPackageJson.name
          ? {
              [presetPackageJson.name]: presetPackageJson.version,
              [CORE_PACKAGE_NAME]:
                presetPackageJson.dependencies?.[CORE_PACKAGE_NAME],
            }
          : {}),
      },
    ],
  ];

  return Object.fromEntries(
    [
      ["name", packageName],
      [
        "private",
        packageJson.private != undefined
          ? packageJson.private
          : (isMonorepo && !monorepoPackageJson) || undefined,
      ],
      ["version", packageJson.version || "0.0.1"],
      ["description", description],
      ["keywords", packageJson.keywords || []],
      [
        "homepage",
        packageJson.homepage ||
          `${await getRepoUrl(config, packageName)}#readme`,
      ],
      [
        "repository",
        packageJson.repository || {
          type: "git",
          url: `${await getRepoUrl(config, packageName)}.git`,
          ...(subpackagePath ? { directory: subpackagePath } : {}),
        },
      ],
      [
        "bugs",
        packageJson.bugs || {
          url: `${await getRepoUrl(config, packageName)}/issues`,
        },
      ],
      ["author", packageJson.author || (await getPackageJsonAuthor(config))],
      [
        "license",
        packageJson.license || (await getLicense(config, packageJson)),
      ],
      ...(!isMonorepo || monorepoPackageJson
        ? [
            ["main", packageJson.main || `${distDir}/index.js`],
            ["types", packageJson.types || `${distDir}/index.d.ts`],
            [
              "publishConfig",
              packageJson.publishConfig || {
                access: npmAccess,
                registry: npmRegistry,
              },
            ],
          ]
        : [
            [
              "workspaces",
              packageJson.workspaces ||
                (isMonorepo ? { packages: ["./packages/*"] } : undefined),
            ],
          ]),
      ["packageManager", "yarn@3.2.0"],
      ["engines", packageJson.engines || { node: `>=${nodeMinVersion}` }],
      ...Object.entries(packageJson).filter(
        ([key]) => !entriesAfter.some(([keyAfter]) => keyAfter === key)
      ),
      ...entriesAfter,
    ].filter(
      ([key, value]) =>
        value != null &&
        (key !== "dependencies" || Object.keys(value as object).length !== 0)
    )
  ) as PackageJson;
};
