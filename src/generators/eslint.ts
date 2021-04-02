import path from "path";

import type { TemplateFile, TemplateGenerator } from "../types";
import { readFileOr } from "../utils";

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
  files: async ({ distDir }) => [
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
    // Justification: Required for cases like \`try { ... } catch (err) {}\` and doesn't do much harm
    "no-empty": "off",
    // Justification: Sometimes you just need a no-op and empty functions aren't a huge problem anyway
    "@typescript-eslint/no-empty-function": "off",
    // Justification: Makes using things like \`Error.captureStackTrace\` painful
    "@typescript-eslint/unbound-method": "off",
    // Justification: Some functions need to be async for API requirements but await nothing
    "@typescript-eslint/require-await": "off",
    // Justification: Sometimes you want empty interfaces and they don't hurt anyone
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-explicit-any": "off",

    // Modified rules
    // Justification: Allow intentionally infinite loops for cases like polling
    "no-constant-condition": ["error", { checkLoops: false }],
    // Justification: Ignore pattern for cases like \`const cb = (_a, b) => b + 1\`
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    // Justification: This allows \`() => Promise<void>\` functions to be allowed when \`() => void\` is expected.
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: false },
    ],
    // Justification: This rule can be tedious for simple functions like \`() => 123\` and should
    //                be made looser wherever possible
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      { allowExpressions: true },
    ],

    // Enabled rules
    // Justification: Cyclic dependencies are confusing and cause bugs
    "import/no-cycle": "error",
    // Justification: You should only use dependencies that exist in your package.
    "import/no-extraneous-dependencies": "error",
    // Justification: Duplicate imports are confusing.
    "import/no-duplicates": ["error", { considerQueryString: true }],
    // Justification: Keeps imports neat and readable
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
    // Justification: same as import/order
    "sort-imports": [
      "error",
      {
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],
    // Justification: Readability
    "import/first": "error",
    // Justification: Readability
    "import/newline-after-import": "error",
    // Justification: Readability
    "import/no-useless-path-segments": "error",
    // Justification: Why would you ever want to do this?
    "import/no-self-import": "error",
    // Justification: Forgetting to await a promise is a common mistake
    "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true }],
  },
};

try {
  // TODO: Merge these in smartly rather than just overwriting everything
  Object.assign(module.exports, require('./config/.eslintrc'));
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
      path: [".huskyrc.js"],
      contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./config/.huskyrc.js instead)
      
module.exports = {
  "pre-commit": "lint-staged",
  "pre-push": "project-pre-push"
};

try {
  Object.assign(module.exports, require('./config/.huskyrc'));
} catch (_err) {}
`,
    },
  ],
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
