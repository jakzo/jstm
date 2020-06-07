import { Linter } from 'eslint';

export const config: Linter.Config = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/typescript',
    'plugin:import/errors',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  plugins: [
    // Downgrade linting errors to warnings when running in the VSCode extension so that they can
    // be distinguished from compiler errors by showing a yellow underline instead of red
    ...(process.env.VSCODE_PID ? ['only-warn'] : []),
  ],
  env: {
    es2017: true,
    node: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
    project: './src/config/tsconfig.eslint.json',
    tsconfigRootDir: process.cwd(),
  },
  rules: {
    // Justification: Required for cases like `try { ... } catch (err) {}` and doesn't do much harm
    'no-empty': 'off',
    // Justification: It is tedious for simple functions like `() => 123`
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Justification: Sometimes you just need a no-op and empty functions aren't a huge problem anyway
    '@typescript-eslint/no-empty-function': 'off',
    // Justification: Makes using things like `Error.captureStackTrace` painful; Also errors when defining
    // polymorphic interfaces such as `interface A { b(): bool; b(x: number): bool; }`; Causes errors when applying mocks.
    '@typescript-eslint/unbound-method': 'off',
    // Justification: Some functions need to be async for API requirements but await nothing
    '@typescript-eslint/require-await': 'off',
    // Justification: Sometimes you want empty interfaces and they don't hurt anyone
    '@typescript-eslint/no-empty-interface': 'off',
    // Justification: Often the return types are trivial
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Modified rules

    // Justification: Allow intentionally infinite loops for cases like polling
    'no-constant-condition': ['error', { checkLoops: false }],
    // Justification: Ignore pattern for cases like `const cb = (_a, b) => b + 1`
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Justification: This allows `() => Promise<void>` functions to be allowed when `() => void` is expected.
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],

    // Enabled rules

    // Justification: Forgetting to await a promise is a common mistake
    '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
    // Justification: Cyclic dependencies are confusing and cause bugs
    'import/no-cycle': 'error',
    // Justification: Keeps imports neat and readable
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'internal', ['index', 'sibling', 'parent']],
        alphabetize: { order: 'asc' },
      },
    ],
    // Justification: same as import/order
    // Configure 'sort-imports' so it doesn't conflict with 'import/order'.
    // This sorts imports within braces, eg: import { <sorted> } from 'x';
    'sort-imports': [
      'error',
      {
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],

    // Justification: Readability
    'import/first': 'error',
    // Justification: Readability
    'import/newline-after-import': 'error',
    // Justification: Readability
    'import/no-useless-path-segments': 'error',
    // Justification: Why would you ever want to do this?
    'import/no-self-import': 'error',
  },
  overrides: [
    {
      // Test files
      files: [
        '**/__*__/**',
        '**/tests/**',
        '**/test/**',
        '**/*.test.*',
        '**/*-test.*',
        '**/*.spec.*',
        '**/*-spec.*',
      ],
      extends: ['plugin:jest/recommended'],
      rules: {
        // Justification: Mocks missing unused properties commonly need to be cast to a valid type
        '@typescript-eslint/no-explicit-any': 'off',
        // Justification: Error checking not necessary for tests
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    {
      // JS files
      files: ['./**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
