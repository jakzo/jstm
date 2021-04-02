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

const getBinName = async () => {
  const binName = path.basename(process.argv[1]);
  if (binName === "bin.js") return "project";

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

  return binName;
};

const main = async () => {
  let cwd = process.cwd();
  while (cwd.includes("node_modules") || cwd.includes("commands-stub"))
    cwd = path.join(cwd, "..");
  process.chdir(cwd);
  const binName = await getBinName();

  require("ts-node").register({ transpileOnly: true });
  require("tsconfig-paths").register();

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
