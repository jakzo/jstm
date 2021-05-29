import path from "path";

import * as fse from "fs-extra";

import type { TemplateFile, TemplateGenerator } from "../types";
import { mergeJsonFile, readFileOr } from "../utils";
import {
  getDescription,
  getDistDir,
  getIsMonorepo,
  getMainBranch,
  getNodeTargetVersion,
  getNpmRegistry,
  getPackageName,
  getSrcDir,
} from "./utils/config";

const JSTM_DIR = path.join(__dirname, "..", "..");

const addFilesFromDir = async (pathParts: string[]): Promise<TemplateFile[]> =>
  (
    await Promise.all(
      (
        await fse.readdir(path.join(JSTM_DIR, ...pathParts), {
          withFileTypes: true,
        })
      ).map(async (entry) =>
        entry.isFile()
          ? [
              {
                path: [...pathParts, entry.name],
                isCheckedIn: true,
                doNotTrim: true,
                doNotFormat: true,
                contents: await fse.readFile(
                  path.join(JSTM_DIR, ...pathParts, entry.name),
                  "utf8"
                ),
              },
            ]
          : entry.isDirectory()
          ? await addFilesFromDir([...pathParts, entry.name])
          : []
      )
    )
  ).flat();

export const common: TemplateGenerator = {
  devDependencies: ["jest", "ts-jest", "@types/jest", "rimraf"],
  files: async ({ config, packageJson }) => {
    const rootDir = process.cwd();

    const isMonorepo = await getIsMonorepo(config);
    const packageName = await getPackageName(config, packageJson, isMonorepo);
    const description = await getDescription(config, packageJson);
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeTargetVersion = await getNodeTargetVersion(config);
    const npmRegistry = await getNpmRegistry(config);
    const mainBranch = await getMainBranch(config);

    return [
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
# You may add your own rules below the end of this generated section.

# Commonly ignored files
node_modules/
.*cache
.jest
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
/package-lock.json

# Rules for Yarn zero-installs
.yarn/*
!.yarn/cache
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# jstm generated files
${distDir}/
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
        // TODO: Figure out how to make this work well in a monorepo
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
!${distDir}/**
${distDir}/**/*.tsbuildinfo

# Include source files (so that source maps work)
!${srcDir}/**

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
        contents: "^1.22.10",
      },
      {
        path: [".yarnrc.yml"],
        isCheckedIn: true,
        doNotOverwrite: true,
        contents: `
changesetBaseRefs:
  - ${mainBranch}
  - origin/${mainBranch}
  - upstream/${mainBranch}

npmRegistryServer: ${npmRegistry}

plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-typescript.cjs
    spec: "@yarnpkg/plugin-typescript"

yarnPath: .yarn/releases/yarn-berry.cjs
`,
      },
      ...((await fse.pathExists(path.join(rootDir, ".yarnrc.yml")))
        ? []
        : [
            ...(await addFilesFromDir([".yarn", "releases"])),
            ...(await addFilesFromDir([".yarn", "plugins"])),
            ...(await addFilesFromDir([".yarn", "sdks"])),
          ]),
      {
        path: [".yarn", "releases", "yarn-berry.cjs"],
        isCheckedIn: true,
        contents: async () =>
          fse.readFile(
            path.join(JSTM_DIR, ".yarn", "releases", "yarn-berry.cjs"),
            "utf8"
          ),
      },
      {
        path: [".vscode", "settings.json"],
        isCheckedIn: true,
        contents: await mergeJsonFile(
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
              "typescript.tsdk": ".yarn/sdks/typescript/lib",
              "search.exclude": {
                "**/.yarn": true,
                "**/.pnp.*": true,
              },
              "eslint.nodePath": ".yarn/sdks",
              "prettier.prettierPath": ".yarn/sdks/prettier/index.js",
              "typescript.enablePromptUseWorkspaceTsdk": true,
            } as Record<string, unknown>
          )
        ),
      },
      {
        path: [".vscode", "extensions.json"],
        isCheckedIn: true,
        contents: await mergeJsonFile(path.join(".vscode", "extensions.json"), {
          recommendations: [
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "arcanis.vscode-zipfs",
          ],
        }),
      },
      {
        path: [".vim", "coc-settings.json"],
        isCheckedIn: true,
        contents: await mergeJsonFile(path.join(".vim", "coc-settings.json"), {
          "eslint.packageManager": "yarn",
          "eslint.nodePath": ".yarn/sdks",
          "workspace.workspaceFolderCheckCwd": false,
          "tsserver.tsdk": ".yarn/sdks/typescript/lib",
        }),
      },
    ];
  },
};
