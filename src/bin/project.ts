#!/usr/bin/env node

import { initProject } from '../generate';

export const main = async () => {
  try {
    await initProject(process.cwd(), process.argv.includes('--recreate-gitignore'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) void main();
