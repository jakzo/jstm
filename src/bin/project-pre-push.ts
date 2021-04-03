#!/usr/bin/env node
import { fork } from "child_process";
import path from "path";

import { readChangesetState } from "@changesets/release-utils";
import chalk from "chalk";
import inquirer from "inquirer";

const forkPromise = (modulePath: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = fork(modulePath, args, { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exited with code: ${code}`));
    });
  });

export const main = async (): Promise<void> => {
  const { changesets } = await readChangesetState();
  if (changesets.length > 0) return;

  console.log(
    chalk.yellow(
      "Warning: changesets are required to merge to master but none were found."
    )
  );
  const { shouldCreate } = await inquirer.prompt<{ shouldCreate: boolean }>([
    {
      name: "shouldCreate",
      message: "Would you like to generate one now?",
      type: "confirm",
      default: true,
    },
  ]);
  if (!shouldCreate) return;

  await forkPromise(
    path.join(__dirname, "..", "..", "node_modules", ".bin", "changeset"),
    []
  );
  console.log(
    chalk.blueBright("Please run `git push` again to push with changelog.")
  );
  process.exit(1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
