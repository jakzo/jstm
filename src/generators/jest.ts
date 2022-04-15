import type { TemplateGenerator } from "../types";
import { getDistDir, getSrcDir } from "./utils/config";

export const jest: TemplateGenerator = {
  devDependencies: ["jest", "ts-jest", "@types/jest", "rimraf"],
  files: async ({ config }) => {
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);

    return [
      {
        path: ["jest.config.js"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./config/jest.config.js instead)
const { getModuleNameMap } = require('@jstm/core');

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
  testRegex: '/__tests__/.+\\\\.test\\\\.(?:js|jsx|ts|tsx)$',
  moduleNameMapper: getModuleNameMap(__dirname),
  maxWorkers: 1,
};

try {
  Object.assign(module.exports, require('./config/jest.config'));
} catch (_err) {}
`,
      },
    ];
  },
};
