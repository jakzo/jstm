#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

const fse = require("fs-extra");

const scriptExists = (filePath) => {
  try {
    require.resolve(filePath);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const nodeModulesBinContents = await fse.readFile(process.argv[1], "utf8");
  const commandsStubBinContents = await fse.readFile(
    path.join(process.cwd(), "commands-stub", "bin.js"),
    "utf8"
  );
  if (nodeModulesBinContents !== commandsStubBinContents) {
    console.log(
      "Linked binaries are out of sync with commands-stub package. Reinstalling..."
    );
    spawnSync(
      "yarn",
      ["add", "-D", "@jstm/commands-stub@file:./commands-stub", "--force"],
      { stdio: "inherit" }
    );
    console.log(
      "Reinstall complete. Will attempt to continue current command using old binary but may fail."
    );
  }

  require("ts-node").register();
  require("tsconfig-paths").register();

  const binName = path.basename(process.argv[1]);
  const binPaths = [
    `${process.cwd()}/presets/template/${binName}`,
    `${process.cwd()}/src/bin/${binName}`,
  ];
  for (const binPath of binPaths) {
    if (scriptExists(binPath)) {
      require(binPath);
      return;
    }
  }
  throw new Error(`Binary not found: ${binName}`);
};

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
