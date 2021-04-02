#!/usr/bin/env node
import { runIfScriptExists } from "@jstm/core";

try {
  const scriptName = process.argv[2];
  if (!scriptName) throw new Error("No script name provided");
  runIfScriptExists(scriptName);
} catch (err) {
  console.error(err);
  process.exit(1);
}
