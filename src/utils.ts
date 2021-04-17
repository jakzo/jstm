import { spawn } from "child_process";
import { Module } from "module";
import path from "path";

import * as fse from "fs-extra";
import * as fleece from "golden-fleece";
import * as prettier from "prettier";
import type { PackageJson } from "type-fest";

import type { Formatter } from "./types";

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

export const prettierFormatter: Formatter = (filename, contents) => {
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

/** Makes `require()` calls resolve absolute paths relative to the specified
 * node module. This is useful when external tools require modules
 * not included in their package.json as dependencies (eg. ESLint importing
 * plugins) and the modules have not been hoisted to the top level (eg. if
 * the plugin module depends on a different version of a module already
 * included in the project, the plugin module will be installed inside
 * `node_modules/@jstm/my-preset/node_modules/my-plugin` and ESLint will not
 * be able to import it from the main project). */
export const includeImportPathsFrom = (moduleName: string): void => {
  // https://github.com/nodejs/node/blob/94405650aebbb16dde6fcc215e1ba912ced0111d/lib/internal/modules/cjs/loader.js#L669
  const isAbsolutePath = (request: string): boolean =>
    request[0] !== "." ||
    (request.length > 1 &&
      request[1] !== "." &&
      request[1] !== "/" &&
      (!isWindows || request[1] !== "\\"));
  const isWindows = process.platform === "win32";

  // Add desired module to require cache so we can get its node_modules paths
  require(moduleName);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const modulePaths = require.cache[require.resolve(moduleName)]!.paths;

  // node itself uses a similar hack for ESLint
  // https://github.com/nodejs/node/blob/4268fae04acc16b34fb302d63b01a85725ef2043/.eslintrc.js#L23
  const M = Module as typeof Module & {
    _resolveLookupPaths(request: string, parent: NodeModule): string[] | null;
  };
  const moduleResolveLookupPaths = M._resolveLookupPaths;
  M._resolveLookupPaths = (request, parent) => {
    const paths = moduleResolveLookupPaths(request, parent);
    return paths && isAbsolutePath(request)
      ? // Module paths are appended rather than prepended meaning that if a
        // module exists in both the requester's node_modules and the preset's
        // node_modules it will use the requester's one
        [...new Set([...paths, ...modulePaths])]
      : paths;
  };
};
