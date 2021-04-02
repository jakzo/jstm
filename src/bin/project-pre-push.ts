#!/usr/bin/env node
import { execSync, fork } from "child_process";

import chalk from "chalk";

const forkPromise = (modulePath: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = fork(modulePath, args, { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exited with code: ${code}`));
    });
  });

const exec = (cmd: string): Buffer => execSync(cmd, { stdio: "inherit" });

export const main = async (): Promise<void> => {
  try {
    console.log(
      chalk.blueBright("Enter changeset information or press escape to skip...")
    );
    await forkPromise("../../node_modules/.bin/changeset", []);
    exec("git add .changeset");
    exec('git commit -n -m "add changeset"');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

void main();
