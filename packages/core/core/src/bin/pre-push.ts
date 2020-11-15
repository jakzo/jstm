#!/usr/bin/env node

import { execSync, fork } from 'child_process';

import chalk from 'chalk';

const forkPromise = (modulePath: string, args: string[]) =>
  new Promise((resolve, reject) => {
    const proc = fork(modulePath, args, { stdio: 'inherit' });
    proc.on('exit', code => {
      if (code === 0) resolve();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      else reject(new Error(`Exited with code: ${code}`));
    });
  });

const exec = (cmd: string) => execSync(cmd, { stdio: 'inherit' });

export const main = async () => {
  try {
    console.log(chalk.blueBright('Enter changeset information or press escape to skip...'));
    await forkPromise('../../node_modules/.bin/changeset', []);
    exec('git add .changeset');
    exec('git commit -n -m "add changeset"');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) void main();
