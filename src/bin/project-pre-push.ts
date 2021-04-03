#!/usr/bin/env node
import { fork } from "child_process";
import path from "path";

import chalk from "chalk";

const forkPromise = (modulePath: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = fork(modulePath, args, { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exited with code: ${code}`));
    });
  });

export const main = async (): Promise<void> => {
  try {
    console.log(
      chalk.blueBright("Enter changeset information or press escape to skip...")
    );
    await forkPromise(
      path.join(__dirname, "..", "..", "node_modules", ".bin", "changeset"),
      []
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

void main();
