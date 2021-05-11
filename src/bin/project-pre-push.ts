#!/usr/bin/env node
import { execSync } from "child_process";

import { readChangesetState } from "@changesets/release-utils";
import chalk from "chalk";
import inquirer from "inquirer";

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

  execSync("yarn changeset", { stdio: "inherit" });
  console.log(
    chalk.blueBright(
      "This push will now fail due to changeset being added. Please run `git push` again to push with changeset."
    )
  );
  process.exit(1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
