import path from "path";

import type { TemplateGenerator } from "../types";
import { mergeJson, readFileOr } from "../utils";

interface PackageScriptBuilder<C extends string> {
  add: <K extends string>(
    func: (commands: Record<C, string>) => [K, string]
  ) => PackageScriptBuilder<C | K>;
  entries: () => [string, string][];
}

export const common: TemplateGenerator = {
  devDependencies: ["jest", "ts-jest", "@types/jest", "rimraf"],
  files: async ({
    packageJson,
    packageName,
    description,
    nodeTargetVersion,
    nodeMinVersion,
    srcDir,
    distDir,
    presetPackageJson,
  }) => [
    {
      path: ["package.json"],
      isCheckedIn: true,
      contents: () => {
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
          };
          return builder;
        };

        packageJson.scripts = Object.fromEntries([
          ["=== Generated Scripts (do not modify) ===", ""],
          ...packageScriptBuilder()
            .add(() => ["dev", "ts-node-dev ./src/index.ts"])
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
            .entries(),
          ["=== (end generated scripts) ===", ""],
          ["", ""],
          ...scriptEntries.slice(0, generateScriptStart),
          ...scriptEntries.slice(generatedScriptEnd),
        ]) as Record<string, string>;

        const entriesAfter = [
          ["scripts", packageJson.scripts],
          ["peerDependencies", packageJson.peerDependencies],
          ["optionalDependencies", packageJson.optionalDependencies],
          ["dependencies", packageJson.dependencies],
          [
            "devDependencies",
            packageJson.devDependencies || {
              [presetPackageJson.name as string]: `^${presetPackageJson.version}`,
            },
          ],
        ];

        const repoName = packageName.split("/").slice(-1)[0];
        return JSON.stringify(
          Object.fromEntries(
            [
              ["name", packageName],
              ["private", packageJson.private],
              ["version", packageJson.version || "0.0.1"],
              ["description", packageJson.description || ""],
              ["keywords", packageJson.keywords || []],
              [
                "homepage",
                packageJson.homepage ||
                  `https://github.com/jakzo/${repoName}#readme`,
              ],
              [
                "repository",
                packageJson.repository || {
                  type: "git",
                  url: `https://github.com/jakzo/${repoName}.git`,
                },
              ],
              [
                "bugs",
                packageJson.bugs || {
                  url: `https://github.com/jakzo/${repoName}/issues`,
                  email: "jack@jf.id.au",
                },
              ],
              // TODO: Prompt these default values from the user
              ["author", packageJson.author || "Jack Field"],
              ["license", packageJson.license || "MIT"],
              ["main", packageJson.main || `${distDir}/index.js`],
              ["types", packageJson.types || `${distDir}/index.d.ts`],
              [
                "engines",
                packageJson.engines || { node: `>=${nodeMinVersion}` },
              ],
              ...Object.entries(packageJson).filter(
                ([key]) => !entriesAfter.some(([keyAfter]) => keyAfter === key)
              ),
              ...entriesAfter,
            ].filter(([, value]) => value != null)
          ),
          null,
          // TODO: Find tab size of existing package.json
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
      contents: `
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
Hi! 👋 Contributions are welcome -- feel free to open a PR for small fixes or open an issue for bigger changes, discussion or if unsure about how to implement something.

## Dev Instructions

Before starting, install dependencies with:

\`\`\`sh
yarn
\`\`\`

To start the application in development mode while auto-reloading on change:

\`\`\`sh
yarn dev
\`\`\`

Other common commands are:

\`\`\`sh
yarn test:watch
yarn lint:fix
\`\`\`

See [package.json](./package.json) for more.
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
      contents: `${nodeTargetVersion}\n`,
    },
    {
      path: [".ymvrc"],
      contents: "1.9.2\n",
    },
    {
      path: ["jest.config.js"],
      contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./config/jest.config.js instead)

module.exports = {
  automock: false,
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: false,
  coverageDirectory: './.coverage',
  collectCoverageFrom: ['./${srcDir}/**/*.{js,jsx,ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.cache/', '/.git/', '/${distDir}/'],
  watchPathIgnorePatterns: ['/node_modules/', '/.cache/', '/.git/', '/${distDir}/'],
  testRegex: '/__tests__/.+\\.test\\.(?:js|jsx|ts|tsx)$',
};

try {
  Object.assign(module.exports, require('./config/jest.config'));
} catch (_err) {}
`,
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
      path: [".github", "workflow", "ci.yml"],
      isCheckedIn: true,
      contents: `
# DO NOT MODIFY
# This file is auto-generated (make another YAML file in this directory instead)
name: CI

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - "*"

env:
  node_version: ${nodeTargetVersion}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: \${{ env.node_version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Test
        run: |
          yarn run-if-script-exists test:ci:before
          yarn test:all
          yarn run-if-script-exists test:ci:after

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/master'
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
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          yarn changeset version
          git push
      - name: Publish to npm
        id: publish
        run: |
          echo '//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}' > .npmrc
          yarn run-if-script-exists release:ci:before
          yarn release
          echo "::set-output name=version_tag::$(git describe --tags --abbrev=0)"
          echo "::set-output name=release_changelog::$(node -e '
            const changelog = require("fs").readFileSync("CHANGELOG.md", "utf8");
            const { version } = require("./package.json");
            const { content } = require("@changesets/release-utils").getChangelogEntry(changelog, version);
            console.log(content.replace(/[%\\r\\n]/g, ch =>
              \`%\${ch.charCodeAt(0).toString(16).padStart(2, "0")}\`));
          ')"
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
      - name: After release
        run: yarn run-if-script-exists release:ci:after
`,
    },
  ],
};
