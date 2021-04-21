import path from "path";

import type { TemplateGenerator } from "../types";
import { mergeJson, readFileOr } from "../utils";
import {
  getDescription,
  getDistDir,
  getLicense,
  getNodeMinVersion,
  getNodeTargetVersion,
  getNpmAccess,
  getNpmPublishRegistry,
  getNpmRegistry,
  getPackageJsonAuthor,
  getPackageName,
  getRepoUrl,
  getSrcDir,
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

export const common: TemplateGenerator = {
  devDependencies: ["jest", "ts-jest", "@types/jest", "rimraf"],
  files: async ({
    config,
    packageJson,
    presetPackageJson,
    devDependencies,
  }) => {
    const packageName = await getPackageName(config, packageJson);
    const description = await getDescription(config, packageJson);
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeMinVersion = await getNodeMinVersion(config);
    const nodeTargetVersion = await getNodeTargetVersion(config);
    const npmRegistry = await getNpmRegistry(config);
    const npmPublishRegistry = await getNpmPublishRegistry(config);
    const npmAccess = await getNpmAccess(config);

    return [
      {
        path: ["package.json"],
        isCheckedIn: true,
        contents: async () => {
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
          const [
            generateScriptStart,
            generatedScriptEnd,
          ] = getGeneratedScriptIndexes();

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
              `rimraf "./${distDir}" *.tsbuildinfo && run-if-script-exists build:clean:custom`,
            ])
            .add(() => ["build:typescript", "tsc -p ./tsconfig.build.json"])
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
              `tsc -p ./tsconfig.json --noEmit && ${c["build:typescript"]} --noEmit`,
            ])
            .add((c) => [
              "test:all",
              `${c["test:typecheck"]} && ${c.lint} && ${c.test}`,
            ])
            .add((c) => [
              "release",
              `${c["build:clean"]} && ${c.build} && changeset publish && run-if-script-exists release:custom`,
            ])
            .add(() => [
              "prepare",
              "husky install && run-if-script-exists prepare:custom",
            ]);
          packageJson.scripts = Object.fromEntries([
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
          ]) as Record<string, string>;

          const packageJsonDeps = packageJson.dependencies || {};
          const entriesAfter = [
            ["scripts", packageJson.scripts],
            ["peerDependencies", packageJson.peerDependencies],
            ["optionalDependencies", packageJson.optionalDependencies],
            [
              "dependencies",
              Object.fromEntries(
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
                ...Object.fromEntries(
                  Object.entries(devDependencies).filter(
                    ([key]) =>
                      !Object.prototype.hasOwnProperty.call(
                        packageJsonDeps,
                        key
                      )
                  )
                ),
                [presetPackageJson.name as string]: presetPackageJson.version,
              },
            ],
          ];

          return JSON.stringify(
            Object.fromEntries(
              [
                ["name", packageName],
                ["private", packageJson.private],
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
                  },
                ],
                [
                  "bugs",
                  packageJson.bugs || {
                    url: `${await getRepoUrl(config, packageName)}/issues`,
                  },
                ],
                // TODO: Prompt these default values from the user
                [
                  "author",
                  packageJson.author || (await getPackageJsonAuthor(config)),
                ],
                [
                  "license",
                  packageJson.license ||
                    (await getLicense(config, packageJson)),
                ],
                ["main", packageJson.main || `${distDir}/index.js`],
                ["types", packageJson.types || `${distDir}/index.d.ts`],
                [
                  "engines",
                  packageJson.engines || { node: `>=${nodeMinVersion}` },
                ],
                [
                  "publishConfig",
                  packageJson.publishConfig || {
                    access: npmAccess,
                    registry: npmPublishRegistry,
                  },
                ],
                ...Object.entries(packageJson).filter(
                  ([key]) =>
                    !entriesAfter.some(([keyAfter]) => keyAfter === key)
                ),
                ...entriesAfter,
              ].filter(([, value]) => value != null)
            ),
            null,
            2
          );
        },
      },
      {
        path: [".npmrc"],
        contents: `
registry = "${npmRegistry}"
`,
      },
      {
        path: ["src", "index.ts"],
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: "",
      },
      {
        path: ["README.md"],
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: async () => `
# ${packageName}
${description ? `\n_${description}_\n` : ""}
## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions how to develop locally and make changes.
`,
      },
      {
        path: ["CONTRIBUTING.md"],
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: `
Hi! 👋 Contributions are welcome -- feel free to open a PR for small fixes or open an issue for \
bigger changes, discussion or if unsure about how to implement something.

## Dev Instructions

Before starting, install dependencies with:

\`\`\`sh
yarn
\`\`\`

Common commands are:

\`\`\`sh
yarn test:watch
yarn lint:fix
\`\`\`

See [package.json](./package.json) for more.

## Releasing changes

When you run \`git push\` you should be prompted to add a changeset if one doesn't already exist. \
This will ask for a description for the change to appear in the changelog as well as the type of \
bump (major, minor or patch) to make to the package. A PR without a changelog will not perform a \
release or bump the package version.
`,
      },
      {
        path: [".gitignore"],
        isCheckedIn: true,
        contents: async ({ gitignorePatterns }) => `
# === Generated Ignore Patterns (do not modify) ===
/${distDir}/
node_modules/
.*cache
.jest
.yarn
*.tsbuildinfo
*.log
.coverage/
.DS_Store
CVS
.svn
.hg
.lock-wscript
.wafpickle-N
.*.swp
._*
.npmrc
config.gypi
${gitignorePatterns.join("\n")}
# === (end generated patterns) ===

${await readFileOr(
  ".gitignore",
  "# Place custom ignore patterns below here and they will not be removed"
).then((contents) =>
  contents.replace(/^\s*# === Generated [^]+# === [^\n]+(?:\n|$)/m, "").trim()
)}
`,
      },
      {
        path: [".npmignore"],
        contents: `
# DO NOT MODIFY
# This file is auto-generated (make changes to ./config/.npmignore instead)

# Ignore all files and make exceptions only for required files
**

# Include package files
!/package.json
!/README.md
!/CHANGELOG.md

# Include build files (but not .tsbuildinfo)
!/${distDir}/**
/${distDir}/**/*.tsbuildinfo

# Include source files (so that source maps work)
!/${srcDir}/**

# Remove test/development files from source
__*__

# === Custom Config Rules ===
# (rules from ./config/.npmignore will appear below)

${await readFileOr(path.join("config", ".npmignore"), "")}
`,
      },
      {
        path: [".nvmrc"],
        contents: `${nodeTargetVersion}`,
      },
      {
        path: [".yvmrc"],
        contents: "1.9.2",
      },
      {
        path: [".vscode", "settings.json"],
        isCheckedIn: true,
        contents: await mergeJson(
          path.join(".vscode", "settings.json"),
          [
            "javascript",
            "javascriptreact",
            "typescript",
            "typescriptreact",
          ].reduce(
            (settings, lang) => {
              settings[`[${lang}]`] = {
                "editor.defaultFormatter": "dbaeumer.vscode-eslint",
              };
              return settings;
            },
            {
              "editor.formatOnSave": true,
              "editor.defaultFormatter": "esbenp.prettier-vscode",
              "eslint.format.enable": true,
            } as Record<string, unknown>
          )
        ),
      },
      {
        path: [".vscode", "extensions.json"],
        isCheckedIn: true,
        contents: await mergeJson(path.join(".vscode", "extensions.json"), {
          recommendations: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
        }),
      },
    ];
  },
};
