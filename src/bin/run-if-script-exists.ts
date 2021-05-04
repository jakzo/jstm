#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";

import { PackageJson } from "type-fest";

export const runIfScriptExists = (scriptName: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require(path.join(
    process.cwd(),
    "package.json"
  )) as PackageJson;
  if (packageJson?.scripts?.[scriptName]) {
    const proc = spawn("yarn", ["run", scriptName], {
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      process.exit(code || undefined);
    });
  }
};

try {
  const scriptName = process.argv[2];
  if (!scriptName) throw new Error("No script name provided");
  runIfScriptExists(scriptName);
} catch (err) {
  console.error(err);
  process.exit(1);
}
