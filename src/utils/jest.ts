import fs from "fs";
import path from "path";

import * as goldenFleece from "golden-fleece";
import type { TsConfigJson } from "type-fest";

const regexEscape = (str: string): string =>
  str.replace(/[\\[\]()^$*+?|.{}]/g, "\\$0");

export const getModuleNameMap = (
  rootDir = process.cwd()
): Record<string, string> => {
  const tsconfig = goldenFleece.evaluate(
    fs.readFileSync(path.join(rootDir, "tsconfig.base.json"), "utf8")
  ) as TsConfigJson;
  return Object.fromEntries(
    Object.entries(tsconfig?.compilerOptions?.paths || {})
      .filter(([, modulePaths]) => modulePaths.length > 0)
      .map(([name, modulePaths]) => [`^${regexEscape(name)}$`, modulePaths[0]])
  );
};
