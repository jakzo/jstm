#!/usr/bin/env node
const { spawn } = require("child_process");

const scriptName = process.argv[2];
if (require(`${process.cwd()}/package.json`)?.scripts?.[scriptName]) {
  const proc = spawn("yarn", ["run", scriptName], {
    stdio: "inherit",
  });
  proc.on("close", (code) => {
    process.exit(code);
  });
}
