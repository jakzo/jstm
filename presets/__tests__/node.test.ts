import { execSync } from "child_process";
import crypto from "crypto";
import path from "path";

import * as fse from "fs-extra";
import isUtf8 from "isutf8";
import tempy from "tempy";
import { PackageJson } from "type-fest";
import yaml from "yaml";

import rootPackageJson from "../../package.json";
import { getPackageJson } from "../../scripts/generate-preset-packages";
import { Preset, applyPreset, prettierFormatter } from "../../src";
import { Config } from "../../src/config";
import presetNode from "../node";

const REPO_ROOT = path.join(__dirname, "..", "..");

const IGNORED_FILES = ["node_modules", "preset-package"];

// Hard-code the package.json version so that the snapshot does not need to be updated every release
rootPackageJson.version = "1.0.0";

interface SnapshotFiles {
  [name: string]: string | null | SnapshotFiles;
}

const readOrHash = async (filePath: string): Promise<string> => {
  const contents = await fse.readFile(filePath);
  if (
    contents.length < 4096 &&
    isUtf8(contents) &&
    !filePath.includes("/.yarn/")
  )
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
  const presetPackageJson = getPackageJson(
    rootPackageJson as PackageJson,
    preset
  );
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
      // Add stub package peer dependencies because stub packages will fail otherwise
      dependencies: {
        ...packageJson.dependencies,
        ...Object.fromEntries(
          (
            await Promise.all(
              (
                await fse.readdir(path.join(REPO_ROOT, "stub-packages"), {
                  withFileTypes: true,
                })
              ).flatMap((stubDir) =>
                stubDir.isDirectory()
                  ? [
                      fse.readJson(
                        path.join(
                          REPO_ROOT,
                          "stub-packages",
                          stubDir.name,
                          "package.json"
                        )
                      ) as Promise<PackageJson>,
                    ]
                  : []
              )
            )
          ).flatMap((stubPackageJson) =>
            Object.keys(stubPackageJson.peerDependencies!).map(
              (name) =>
                [
                  name,
                  (rootPackageJson.dependencies as Record<string, string>)[
                    name
                  ] ||
                    (rootPackageJson.devDependencies as Record<string, string>)[
                      name
                    ],
                ] as const
            )
          )
        ),
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
  await fse.writeFile(
    path.join(testDir, ".yarnrc.yml"),
    yaml.stringify({
      ...yaml.parse(
        await fse.readFile(path.join(testDir, ".yarnrc.yml"), "utf8")
      ),
      enableNetwork: false,
      npmRegistryServer: "http://localhost:4186",
    })
  );

  // Publish to local Verdaccio registry for tests
  await fse.writeJson(
    path.join(testDir, "package.json"),
    {
      ...(await fse.readJson(path.join(testDir, "package.json"))),
      publishConfig: {
        // TODO: Get port from setup script
        registry: "http://localhost:4186",
      },
    },
    { spaces: 2 }
  );

  const runYarnCommand = (script: string): void => {
    execSync(`yarn ${script}`, {
      cwd: testDir,
      stdio: "inherit",
      env: { ...process.env, CI: undefined, JSTM_TEST_ROOT: REPO_ROOT },
    });
  };

  runYarnCommand("install");
  runYarnCommand("test:all");
  // Disable testing release until Yarn 2 works with Verdaccio
  // https://github.com/yarnpkg/berry/issues/1044
  // runYarnCommand("release");
};

test("default config", async () => testPreset(presetNode, "default"));

test("monorepo", async () =>
  testPreset(presetNode, "monorepo", {
    isMonorepo: true,
    subpackageDescription: "Subpackage description",
  }));
