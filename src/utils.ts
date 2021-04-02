import { spawn } from "child_process";
import path from "path";

import * as fse from "fs-extra";
import * as fleece from "golden-fleece";
import * as prettier from "prettier";
import type { PackageJson } from "type-fest";

import { Preset } from "./types";

export const readFileOr = async <D>(
  filePath: string,
  defaultValue: D
): Promise<string | D> =>
  fse.readFile(filePath, "utf8").catch((err) => {
    if ((err as { code?: string }).code === "ENOENT") return defaultValue;
    throw err;
  });

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// TODO: Add `defaultsToOverwrite` option so we can update values we added but
//       not values added by users
export const mergeJson = async (
  filePath: string,
  properties: Record<string, unknown>,
  overwrite = false
): Promise<string> => {
  const merge = (
    a: Record<string, unknown>,
    b: Record<string, unknown>
  ): Record<string, unknown> => {
    for (const [key, valueB] of Object.entries(b)) {
      if (Object.prototype.hasOwnProperty.call(a, key)) {
        const valueA = a[key];
        if (isObject(valueA) && isObject(valueB)) {
          merge(valueA, valueB);
        } else if (overwrite) {
          a[key] = valueB;
        }
      } else {
        a[key] = valueB;
      }
    }
    return a;
  };
  const contents = await readFileOr(filePath, "{}");
  return fleece.patch(contents, merge(fleece.evaluate(contents), properties));
};

export const runIfScriptExists = (scriptName: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require(`${process.cwd()}/package.json`) as PackageJson;
  if (packageJson?.scripts?.[scriptName]) {
    const proc = spawn("yarn", ["run", scriptName], {
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      process.exit(code || undefined);
    });
  }
};

export const prettierFormatter: Preset["formatter"] = (filename, contents) => {
  const fileExt = path.extname(filename);
  const parser = Object.entries<string[]>({
    angular: [],
    "babel-flow": [".js", ".jsx"],
    "babel-ts": [],
    babel: [],
    css: [".css"],
    espree: [],
    flow: [],
    glimmer: [],
    graphql: [".graphql"],
    html: [".html", ".htm"],
    json: [".json"],
    json5: [],
    less: [],
    lwc: [],
    markdown: [".md"],
    mdx: [],
    meriyah: [],
    scss: [],
    typescript: [".ts", ".tsx"],
    vue: [],
    yaml: [".yaml", ".yml"],
  }).find(([, extensions]) => extensions.includes(fileExt))?.[0];
  if (!parser) return contents;
  return prettier.format(contents, { parser });
};
