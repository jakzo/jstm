const path = require("path");

const { setup } = require("./utils");

const rootDir = setup();

module.exports = require(path.join(rootDir, "presets", "template"));
