#!/usr/bin/env node
import { applyPresetCli } from "@jstm/core";

import packageJson from "./package.json";
import preset from "./preset";

if (process.env.INIT_CWD) process.chdir(process.env.INIT_CWD);

applyPresetCli(preset, packageJson).catch((err) => {
  console.error(err);
  process.exit(1);
});
