module.exports = {
  watchPathIgnorePatterns: [
    "/node_modules/",
    "/.cache/",
    "/.git/",
    "/dist/",
    "/presets/packages/",
  ],
  globalSetup: "./__tests__/jest.setup.ts",
  globalTeardown: "./__tests__/jest.teardown.ts",
};
