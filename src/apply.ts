import path from "path";

import * as fse from "fs-extra";
import type { PackageJson } from "type-fest";

import { ContentsVars, Preset, TemplateFile, Vars } from "./types";
import { readFileOr } from "./utils";

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

  const vars = await getVars(packageJson, presetPackageJson);
  const files = [];
  for (const generator of preset.generators) {
    files.push(...(await generator.files(vars)));
  }
  const contentsVars = getContentsVars(files);
  const formatter = preset.formatter || ((s) => s);
  const filesWithContents = await asyncMap(files, async (file) => ({
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
  }));
  for (const file of filesWithContents) {
    await writeFileIfChanged(file);
  }
};

export const applyPresetCli = async (
  preset: Preset,
  packageJson: PackageJson
): Promise<void> =>
  applyPreset(preset, packageJson).catch((err) => {
    console.error(err);
    process.exit(1);
  });

const getVars = async (
  packageJson: PackageJson,
  presetPackageJson: PackageJson
): Promise<Vars> => ({
  presetPackageJson,
  packageJson,
  packageName: packageJson.name || `@jakzo/${path.basename(process.cwd())}`,
  description: packageJson.description,
  nodeTargetVersion: 14,
  nodeMinVersion: 12,
  srcDir: "src",
  distDir: "dist",
  mainBranch: "main",
});

const getContentsVars = (files: TemplateFile[]): ContentsVars => ({
  gitignorePatterns: files
    .filter((file) => !file.isCheckedIn)
    .map((file) => file.path.map((part) => `/${part}`).join("")),
});

const writeFileIfChanged = async (file: TemplateFile): Promise<void> => {
  const filePath = path.join(...file.path);
  if (await shouldWriteFile(file)) {
    if (file.path.length > 1)
      await fse.ensureDir(path.join(...file.path.slice(0, -1)));
    await fse.writeFile(filePath, file.contents, {
      mode: file.isExecutable ? 0o755 : undefined,
    });
  }
};

const shouldWriteFile = async (file: TemplateFile): Promise<boolean> => {
  const filePath = path.join(...file.path);
  if (file.doNotOverwrite) return !(await fse.pathExists(filePath));
  if ((await readFileOr(filePath, undefined)) !== file.contents) return true;
  if (file.isExecutable) {
    const { mode } = await fse.stat(filePath);
    if ((mode & 0o700) !== 0o700) await fse.chmod(filePath, mode | 0o700);
  }
  return false;
};
