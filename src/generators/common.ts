import path from "path";

import type { TemplateGenerator } from "../types";
import { mergeJson, readFileOr } from "../utils";
import {
  getDescription,
  getDistDir,
  getLicense,
  getMainBranch,
  getNodeMinVersion,
  getNodeTargetVersion,
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
    const mainBranch = await getMainBranch(config);
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeMinVersion = await getNodeMinVersion(config);
    const nodeTargetVersion = await getNodeTargetVersion(config);

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

          const entriesAfter = [
            ["scripts", packageJson.scripts],
            ["peerDependencies", packageJson.peerDependencies],
            ["optionalDependencies", packageJson.optionalDependencies],
            [
              "dependencies",
              Object.fromEntries(
                Object.entries(packageJson.dependencies || {}).filter(
                  ([key]) =>
                    !Object.prototype.hasOwnProperty.call(devDependencies, key)
                )
              ),
            ],
            [
              "devDependencies",
              {
                ...packageJson.devDependencies,
                ...devDependencies,
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
      {
        path: [".github", "workflows", "ci.yml"],
        isCheckedIn: true,
        contents: `
# DO NOT MODIFY
# This file is auto-generated (make another YAML file in this directory instead)
name: CI

on:
  push:
    branches:
      - ${mainBranch}
  pull_request:
    branches:
      - "*"

env:
  node_version: ${nodeTargetVersion}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    outputs:
      release_required: \${{ steps.release_required.outputs.result }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          # Fetch Git history so that Changesets can check if release is required
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: \${{ env.node_version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Test
        run: |
          set -e
          yarn run-if-script-exists test:ci:before
          yarn test:all
          yarn run-if-script-exists test:ci:after
      - name: Check if release is required
        uses: actions/github-script@v3
        id: release_required
        with:
          script: |
            const releaseUtils = require(process.env.GITHUB_WORKSPACE + '/node_modules/@changesets/release-utils');
            const { changesets } = await releaseUtils.readChangesetState();
            return changesets.length > 0;

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: test
    if: \${{ github.ref == 'refs/heads/${mainBranch}' && needs.test.outputs.release_required == 'true' }}
    environment: Release
    outputs:
      release_upload_url: \${{ steps.create_release.outputs.upload_url }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          # Fetch Git history so that Changesets can generate changelogs with correct commits
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: \${{ env.node_version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Bump versions according to changeset
        run: |
          set -e
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          yarn changeset version
          git push --no-verify
      - name: Publish to npm
        id: publish
        run: |
          set -e
          echo '//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}' > .npmrc
          yarn run-if-script-exists release:ci:before
          yarn release
          echo "::set-output name=version_tag::$(git describe --tags --abbrev=0)"
          echo "::set-output name=release_changelog::$(yarn --silent ci-github-print-changelog)"
          yarn run-if-script-exists release:ci:after
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      - name: Create release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ steps.publish.outputs.version_tag }}
          release_name: \${{ steps.publish.outputs.version_tag }}
          body: \${{ steps.publish.outputs.release_changelog }}
`,
      },
    ];
  },
};
