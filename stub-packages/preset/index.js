const path = require("path");

const { setup, teardown } = require("./utils");

const rootDir = setup();

module.exports = require(path.join(rootDir, "presets", "template"));

teardown();
