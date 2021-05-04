import { execSync } from "child_process";
import crypto from "crypto";
import path from "path";

import * as fse from "fs-extra";
import isUtf8 from "isutf8";
import tempy from "tempy";
import { PackageJson } from "type-fest";

import rootPackageJson from "../../package.json";
import { getPackageJson } from "../../scripts/generate-preset-packages";
import { Preset, applyPreset, prettierFormatter } from "../../src";
import { Config } from "../../src/config";
import presetNode from "../node";

const REPO_ROOT = path.join(__dirname, "..", "..");

const IGNORED_FILES = ["node_modules", "preset-package"];

interface SnapshotFiles {
  [name: string]: string | null | SnapshotFiles;
}

const readOrHash = async (filePath: string): Promise<string> => {
  const contents = await fse.readFile(filePath);
  if (contents.length < 4096 && isUtf8(contents))
    return contents.toString("utf8");
  const hash = crypto.createHash("sha256");
  hash.update(await fse.readFile(filePath));
  return `Hash: ${hash.digest("hex")}`;
};

const readFileStructure = async (dir: string): Promise<SnapshotFiles> =>
  (await fse.readdir(dir, { withFileTypes: true })).reduce<
    Promise<SnapshotFiles>
  >(async (filesPromise, entry) => {
    const files = await filesPromise;
    if (!IGNORED_FILES.includes(entry.name))
      files[entry.name] = entry.isDirectory()
        ? await readFileStructure(path.join(dir, entry.name))
        : entry.isFile()
        ? await readOrHash(path.join(dir, entry.name))
        : null;
    return files;
  }, Promise.resolve({}));

const testConfig = (
  dir: string,
  preset: Preset,
  values: Record<string, string | number | boolean>,
  keysPrompted: Set<string> = new Set()
): Config =>
  new Config(
    dir,
    preset.formatter || prettierFormatter,
    (key, _type, opts) => {
      keysPrompted.add(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (values.hasOwnProperty(key)) return values[key] as any;
      if (opts.defaultValue !== undefined) return opts.defaultValue;
      throw new Error(`no value defined for config: ${key}`);
    },
    () => {}
  );

const testPreset = async (
  preset: Preset,
  testName: string,
  configValues: Record<string, unknown> = {}
): Promise<void> => {
  const testDir = tempy.directory({ prefix: `${preset.name}_${testName}_` });
  console.log({ testDir });
  await fse.emptyDir(testDir);
  process.chdir(testDir);

  const keysPrompted = new Set<string>();
  const config = testConfig(
    testDir,
    preset,
    {
      description: "Test package",
      repoUrl: "https://github.com/testorg/testrepo",
      packageJsonAuthor: "Test Person",
      packageName: "@jstm-test/test",
      subpackageName: "@jstm-test/sample",
      ...configValues,
    },
    keysPrompted
  );
  const presetPackageJson = getPackageJson(rootPackageJson, preset);
  await applyPreset(preset, presetPackageJson, config, true);
  expect(keysPrompted).toMatchSnapshot("config prompts");
  expect(await readFileStructure(testDir)).toMatchSnapshot("file structure");

  // Add resolutions to use local jstm packages instead of npm published ones
  const packageJsonPath = path.join(testDir, "package.json");
  const packageJson = (await fse.readJson(packageJsonPath)) as PackageJson;
  await fse.writeJson(
    packageJsonPath,
    {
      ...packageJson,
      resolutions: {
        ...packageJson.resolutions,
        [presetPackageJson.name!]: `file:${path.join(
          REPO_ROOT,
          "stub-packages",
          "preset"
        )}`,
        "@jstm/core": `file:${path.join(REPO_ROOT, "stub-packages", "core")}`,
      },
    } as PackageJson,
    { spaces: 2 }
  );

  // Use jstm's yarn.lock and cache so we don't have to download dependencies every time
  await fse.copy(
    path.join(REPO_ROOT, "yarn.lock"),
    path.join(testDir, "yarn.lock")
  );
  await fse.copy(path.join(REPO_ROOT, ".yarn"), path.join(testDir, ".yarn"));
  await fse.appendFile(
    path.join(testDir, ".yarnrc.yml"),
    "enableNetwork: false\n"
  );

  process.stdout.write("Running: yarn install\n");
  execSync("yarn install", {
    cwd: testDir,
    stdio: "inherit",
    env: { ...process.env, JSTM_TEST_ROOT: REPO_ROOT },
  });

  process.stdout.write("Running: yarn test:all\n");
  execSync("yarn test:all", {
    cwd: testDir,
    stdio: "inherit",
    env: { ...process.env, JSTM_TEST_ROOT: REPO_ROOT },
  });
};

test("default config", async () => testPreset(presetNode, "default"));

test("monorepo", async () =>
  testPreset(presetNode, "monorepo", {
    isMonorepo: true,
    subpackageDescription: "Subpackage description",
  }));
