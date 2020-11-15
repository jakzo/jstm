import { Options } from 'prettier';

declare module 'prettier' {
  interface Options {
    overrides?: Override[];
  }

  interface Override {
    files: string;
    options: Options;
  }
}

export const config: Options = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,

  overrides: [
    // `tabWidth: 2` breaks markdown: https://github.com/prettier/prettier/issues/3223
    {
      files: '*.md',
      options: {
        useTabs: false,
        tabWidth: 4,
      },
    },
  ],
};
