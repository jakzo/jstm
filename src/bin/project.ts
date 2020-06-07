#!/usr/bin/env node

import { initProject } from '../generate';

export const main = async () => {
  try {
    await initProject(process.cwd());
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) void main();
