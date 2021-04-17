import { spawnSync } from "child_process";
import path from "path";

import * as fse from "fs-extra";
import type { PackageJson } from "type-fest";

import { Config } from "./config";
import { Preset, TemplateFileBuilt, Vars } from "./types";
import { prettierFormatter, readFileOr } from "./utils";

const asyncMap = async <T, U>(
  arr: T[],
  func: (item: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> => {
  const result = [];
  for (const [i, item] of arr.entries()) result.push(await func(item, i, arr));
  return result;
};

const trimIf = (str: string, shouldTrim: boolean): string => {
  if (!shouldTrim) return str;
  const trimmed = str.trim();
  if (trimmed === "") return trimmed;
  return `${trimmed}\n`;
};

export const applyPreset = async (
  preset: Preset,
  presetPackageJson: PackageJson
): Promise<void> => {
  const packageJson = JSON.parse(
    await readFileOr("package.json", "{}")
  ) as PackageJson;

  const vars: Vars = {
    config: new Config(process.cwd(), preset.formatter || prettierFormatter),
    presetPackageJson,
    packageJson,
    devDependencies: Object.fromEntries(
      preset.generators.flatMap((gen) =>
        (gen.devDependencies || []).map((key) => [
          key,
          (presetPackageJson.devDependencies || {})[key] || "*",
        ])
      )
    ),
  };
  const files = [];
  for (const generator of preset.generators) {
    files.push(...(await generator.files(vars)));
  }
  const contentsVars = {
    gitignorePatterns: files
      .filter((file) => !file.isCheckedIn)
      .map((file) => file.path.map((part) => `/${part}`).join("")),
  };
  const formatter = preset.formatter || ((s) => s);
  const filesWithContents: TemplateFileBuilt[] = await asyncMap(
    files,
    async (file) => ({
      ...file,
      contents: trimIf(
        formatter(
          file.path[file.path.length - 1],
          typeof file.contents === "function"
            ? await file.contents(contentsVars)
            : file.contents
        ),
        !file.doNotTrim
      ),
      existingContents: await readFileOr(path.join(...file.path), undefined),
    })
  );
  for (const file of filesWithContents) {
    await writeFileIfChanged(file);
  }
  await vars.config.saveProjectConfig();
  await installDepsIfRequired(filesWithContents);
};

export const applyPresetCli = async (
  preset: Preset,
  packageJson: PackageJson
): Promise<void> =>
  applyPreset(preset, packageJson).catch((err) => {
    console.error(err);
    process.exit(1);
  });

const writeFileIfChanged = async (file: TemplateFileBuilt): Promise<void> => {
  const filePath = path.join(...file.path);
  if (await shouldWriteFile(file)) {
    if (file.path.length > 1)
      await fse.ensureDir(path.join(...file.path.slice(0, -1)));
    await fse.writeFile(filePath, file.contents, {
      mode: file.isExecutable ? 0o755 : undefined,
    });
  }
};

const shouldWriteFile = async (file: TemplateFileBuilt): Promise<boolean> => {
  const filePath = path.join(...file.path);
  if (file.doNotOverwrite) return !(await fse.pathExists(filePath));
  if ((await readFileOr(filePath, undefined)) !== file.contents) return true;
  if (file.isExecutable) {
    const { mode } = await fse.stat(filePath);
    if ((mode & 0o700) !== 0o700) await fse.chmod(filePath, mode | 0o700);
  }
  return false;
};

const installDepsIfRequired = async (
  files: TemplateFileBuilt[]
): Promise<void> => {
  const packageJson = files.find(
    (file) => file.path.length === 1 && file.path[0] === "package.json"
  );
  if (!packageJson) return;
  try {
    const existingPackageJson = packageJson.existingContents
      ? (JSON.parse(packageJson.existingContents) as PackageJson)
      : {};
    const newPackageJson = JSON.parse(packageJson.contents) as PackageJson;
    const existingDevDeps = existingPackageJson?.devDependencies || {};
    const newDevDeps = newPackageJson?.devDependencies || {};
    if (serializeDeps(existingDevDeps) !== serializeDeps(newDevDeps)) {
      console.log(
        "devDependencies have been updated. Running `yarn install` now..."
      );
      spawnSync("yarn", ["install", "--ignore-scripts"], { stdio: "inherit" });
    }
  } catch {}
};

const serializeDeps = (deps: Required<PackageJson>["dependencies"]): string =>
  Object.entries(deps)
    .map(([key, version]) => `${key}@${version}`)
    .sort()
    .join(",");
