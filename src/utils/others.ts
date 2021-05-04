import path from "path";

import * as fse from "fs-extra";
import * as fleece from "golden-fleece";
import * as prettier from "prettier";

import type { Formatter } from "../types";

export const readFileOr = async <D>(
  filePath: string,
  defaultValue: D
): Promise<string | D> => {
  try {
    return await fse.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as { code?: string }).code === "ENOENT") return defaultValue;
    throw err;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const merge = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  overwrite: boolean
): Record<string, unknown> => {
  for (const [key, valueB] of Object.entries(b)) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      const valueA = a[key];
      if (isObject(valueA) && isObject(valueB)) {
        merge(valueA, valueB, overwrite);
      } else if (overwrite) {
        a[key] = valueB;
      }
    } else {
      a[key] = valueB;
    }
  }
  return a;
};

// TODO: Add `defaultsToOverwrite` option so we can update values we added but
//       not values added by users
export const mergeJson = async (
  filePath: string,
  properties: Record<string, unknown>,
  overwrite = false
): Promise<string> => {
  const contents = await readFileOr(filePath, "{}");
  return fleece.patch(
    contents,
    merge(fleece.evaluate(contents), properties, overwrite)
  );
};

// TODO: Use Prettier's rules for deciding which parser to use
//       (some files like package.json use a special parser)
const prettierExtToParser = Object.entries({
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
}).reduce<Record<string, string>>((map, [parser, exts]) => {
  for (const ext of exts) map[ext] = parser;
  return map;
}, {});

// TODO: Cache this per `applyPreset()` call
let prettierConfig: prettier.Options | undefined = undefined;

export const prettierFormatter: Formatter = async (filename, contents) => {
  const parser =
    filename === "package.json"
      ? "json-stringify"
      : prettierExtToParser[path.extname(filename)];
  if (!parser) return contents;
  if (!prettierConfig)
    prettierConfig =
      ((await fse.pathExists(".prettierrc.js")) &&
        (await prettier.resolveConfig(".prettierrc.js"))) ||
      {};
  return prettier.format(contents, {
    ...prettierConfig,
    parser,
  });
};
