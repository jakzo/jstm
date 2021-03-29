#!/usr/bin/env node
const { applyPreset } = require("../dist");
const { default: preset } = require("../preset");

const packageJson = require("../package.json");

applyPreset(preset, packageJson).catch((err) => {
  console.error(err);
  process.exit(1);
});
