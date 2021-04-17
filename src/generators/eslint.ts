import path from "path";

import type { TemplateFile, TemplateGenerator } from "../types";
import { readFileOr } from "../utils";
import { getDistDir } from "./utils/config";

export const eslint: TemplateGenerator = {
  devDependencies: [
    "eslint",
    "prettier",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint-config-prettier",
    "eslint-plugin-import",
    "eslint-import-resolver-typescript",
    "eslint-plugin-jest",
    "eslint-plugin-only-warn",
    "eslint-plugin-prettier",
    "husky",
    "lint-staged",
    "chalk",
  ],
  files: async ({ config }) => {
    const distDir = await getDistDir(config);

    return [
      {
        path: [".eslintrc.js"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./config/.eslintrc.js instead)

module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2020: true,
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:import/errors",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript",
  ],
  plugins: [
    "@typescript-eslint/eslint-plugin",
    ...(process.env.VSCODE_PID ? ["only-warn"] : []),
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  overrides: [
    {
      files: ["**/*.{js,jsx}"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
      },
    },
    {
      files: ["**/__*__/"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "no-sparse-arrays": "off",
      },
    },
  ],
  rules: {
    // Disabled rules
    "no-empty": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",

    // Modified rules
    "no-constant-condition": ["error", { checkLoops: false }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: false },
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      { allowExpressions: true },
    ],

    // Enabled rules
    "import/no-cycle": "error",
    "import/no-extraneous-dependencies": "error",
    "import/no-duplicates": ["error", { considerQueryString: true }],
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        groups: [
          "builtin",
          "external",
          "internal",
          ["index", "sibling", "parent"],
        ],
        alphabetize: { order: "asc" },
      },
    ],
    "sort-imports": [
      "error",
      {
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-useless-path-segments": "error",
    "import/no-self-import": "error",
    "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true }],
  },
};

try {
  // TODO: Merge these in smartly rather than just overwriting everything
  Object.assign(module.exports, require('./config/.eslintrc'));
} catch (_err) {}
`,
      },
      {
        path: [".prettierrc.js"],
        contents: `
module.exports = {};

try {
  // TODO: Merge these in smartly rather than just overwriting everything
  Object.assign(module.exports, require('./config/.prettierrc'));
} catch (_err) {}
`,
      },
      ignorefileEntry(".eslintignore", distDir),
      ignorefileEntry(".prettierignore", distDir),
      {
        path: [".lintstagedrc.js"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./config/.lintstagedrc.js instead)

module.exports = {
  "*!(.{js,jsx,ts,tsx})": "prettier -c -w",
  "*.{js,jsx,ts,tsx}": "eslint --cache --fix",
};

try {
  Object.assign(module.exports, require('./config/.lintstagedrc'));
} catch (_err) {}
`,
      },
      {
        path: [".husky", "pre-commit"],
        isExecutable: true,
        contents: `
#!/bin/sh

# DO NOT MODIFY
# This file is auto-generated (make changes to pre-commit-custom instead)

. "$(dirname "$0")/_/husky.sh"

"$(dirname "$0")/../node_modules/.bin/lint-staged"

CUSTOM_SCRIPT="$(dirname "$0")/pre-commit-custom"
if [ -x "$CUSTOM_SCRIPT" ]; then
  "$CUSTOM_SCRIPT"
fi
`,
      },
      {
        path: [".husky", "pre-push"],
        isExecutable: true,
        contents: `
#!/bin/sh

# DO NOT MODIFY
# This file is auto-generated (make changes to pre-push-custom instead)

. "$(dirname "$0")/_/husky.sh"

if [ -t 1 ]; then
  exec </dev/tty
  "$(dirname "$0")/../node_modules/.bin/project-pre-push"
fi

CUSTOM_SCRIPT="$(dirname "$0")/pre-push-custom"
if [ -x "$CUSTOM_SCRIPT" ]; then
  "$CUSTOM_SCRIPT"
fi
`,
      },
      {
        path: [".husky", ".gitignore"],
        contents: "_",
      },
    ];
  },
};

const ignorefileEntry = (filename: string, distDir: string): TemplateFile => ({
  path: [filename],
  contents: async ({ gitignorePatterns }) => `
# DO NOT MODIFY
# This file is auto-generated (make changes to ./config/${filename} instead)

# === Build Files ===
# Files which are the result of transforming other files in the project
${distDir}

# === Cache Files ===
# Generated by tools for caching
node_modules/
.*cache
.jest
.yarn
*.tsbuildinfo

# === Log Files ===
# Log output files intended to be read by people rather than the project
*.log
.coverage/

# === External Files ===
# Files commonly created by the OS or tools not defined in this project
.DS_Store

# === Generated Files ===
# Files generated by tools from the project
yarn.lock
package-lock.json
${gitignorePatterns.join("\n")}

# === Custom Ignore Patterns ===
# Rules from ./config/${filename} will appear below

${await readFileOr(path.join("config", filename), "")}
`,
});
