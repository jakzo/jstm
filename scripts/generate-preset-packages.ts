import path from "path";

import * as fse from "fs-extra";
import type { PackageJson } from "type-fest";

import type { Preset } from "../src/types";

export const getPackageJson = (
  mainPackageJson: PackageJson,
  preset: Preset
): PackageJson => {
  const presetDeps = new Set(
    preset.generators.flatMap((gen) => gen.devDependencies || [])
  );
  const packageNameParts = (mainPackageJson.name as string).split("/");
  const packageJson: PackageJson = {
    ...mainPackageJson,
    name: `${packageNameParts[0]}${
      packageNameParts.length > 1 ? "/" : "-"
    }preset-${preset.name}`,
    description: `Preconfigured project tooling for ${preset.useCase}.`,
    main: "index.js",
    types: "index.d.ts",
    repository: {
      ...(mainPackageJson.repository as { type: string; url: string }),
      directory: "presets",
    },
    bin: {
      project: "project.js",
    },
    dependencies: {
      [mainPackageJson.name as string]: mainPackageJson.version as string,
      tslib: (mainPackageJson.dependencies as PackageJson.Dependency).tslib,
      ...Object.fromEntries(
        Object.entries({
          ...mainPackageJson.devDependencies,
          ...mainPackageJson.dependencies,
        } as PackageJson.Dependency).filter(([dep]) => presetDeps.has(dep))
      ),
    },
    devDependencies: {},
  };
  return packageJson;
};

export const generatePresetPackages = async (): Promise<void> => {
  const packagesDir = path.join(__dirname, "..", "presets", "packages");
  await fse.emptyDir(packagesDir);
  const mainPackageJson = (await fse.readJson(
    path.join(__dirname, "..", "package.json")
  )) as PackageJson;
  const presetsDir = path.join(__dirname, "..", "presets");
  const presetFiles = new Set(
    (await fse.readdir(presetsDir)).flatMap((filename) => {
      const match = /^(\w+)\.ts$/.exec(filename);
      return match ? [match[1]] : [];
    })
  );
  for (const presetFile of presetFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: preset } = require(`../presets/${presetFile}`) as {
      default: Preset;
    };
    const packageJson = getPackageJson(mainPackageJson, preset);

    const packageDir = path.join(packagesDir, presetFile);
    await fse.copy(path.join(presetsDir, "template"), packageDir);
    await fse.writeJson(path.join(packageDir, "package.json"), packageJson, {
      spaces: 2,
    });
    await fse.copy(
      path.join(presetsDir, `${presetFile}.ts`),
      path.join(packageDir, "preset.ts")
    );
  }
};

if (require.main === module)
  generatePresetPackages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
