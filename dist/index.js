const path = require("path");

const fse = require("fs-extra");

const { readFileOr } = require("./utils");

const asyncMap = async (arr, func) => {
  const result = [];
  for (const [i, item] of arr.entries()) result.push(await func(item, i, arr));
  return result;
};

const trimIf = (str, shouldTrim) => {
  if (!shouldTrim) return str;
  const trimmed = str.trim();
  if (trimmed === "") return trimmed;
  return `${trimmed}\n`;
};

exports.applyPreset = async (preset, presetPackageJson) => {
  const packageJson = JSON.parse(await readFileOr("package.json", "{}"));

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

const getVars = async (packageJson, presetPackageJson) => {
  return {
    presetPackageJson,
    packageJson,
    packageName: packageJson.name || `@jakzo/${path.basename(process.cwd())}`,
    description: packageJson.description,
    nodeTargetVersion: 14,
    nodeMinVersion: 10,
    srcDir: "src",
    distDir: "dist",
  };
};

const getContentsVars = (files) => ({
  gitignorePatterns: files
    .filter((file) => !file.isCheckedIn)
    .map((file) => file.path.map((part) => `/${part}`).join("")),
});

const writeFileIfChanged = async (file) => {
  const filePath = path.join(...file.path);
  if (
    file.doNotOverwrite
      ? !(await fse.pathExists(filePath))
      : await readFileOr(filePath).then(
          (existingContents) => existingContents !== file.contents
        )
  ) {
    if (file.path.length > 1)
      await fse.ensureDir(path.join(...file.path.slice(0, -1)));
    await fse.writeFile(filePath, file.contents);
  }
};
