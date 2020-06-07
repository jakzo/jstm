import { Config } from '@jest/types';

export const config: Config.InitialOptions = {
  automock: false,
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: false,
  collectCoverageFrom: ['./src/**/*.{js,jsx,ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // TODO: Get these from the ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: '/__tests__/.+\\.test\\.(?:js|jsx|ts|tsx)$',
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
};
