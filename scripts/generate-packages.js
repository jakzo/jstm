const path = require("path");

const fse = require("fs-extra");

const main = async () => {
  await fse.emptyDir(path.join(__dirname, "..", "packages"));
  const mainPackageJson = await fse.readJson(
    path.join(__dirname, "..", "package.json")
  );
  for (const presetFile of await fse.readdir(
    path.join(__dirname, "..", "presets")
  )) {
    const { default: preset } = require(`../presets/${presetFile}`);
    const presetDeps = new Set(
      preset.generators.flatMap((gen) => gen.devDependencies || [])
    );
    const packageNameParts = mainPackageJson.name.split("/");
    const packageJson = {
      ...mainPackageJson,
      name: `${packageNameParts[0]}${
        packageNameParts.length > 1 ? "/" : "-"
      }preset-${preset.name}`,
      description: `Preconfigured project tooling for ${preset.useCase}.`,
      bin: {
        project: "./bin/project.js",
        "run-if-script-exists": "./bin/run-if-script-exists.js",
      },
      scripts: {
        postinstall: "project",
      },
      dependencies: {
        ...mainPackageJson.dependencies,
        ...Object.fromEntries(
          Object.entries(mainPackageJson.devDependencies).filter(([dep]) =>
            presetDeps.has(dep)
          )
        ),
      },
      devDependencies: {},
    };

    const packageDir = path.join(__dirname, "..", "packages", preset.name);
    await fse.ensureDir(packageDir);
    await fse.writeJson(path.join(packageDir, "package.json"), packageJson, {
      spaces: 2,
    });
    await fse.copy(
      path.join(__dirname, "..", "dist"),
      path.join(packageDir, "dist")
    );
    await fse.ensureDir(path.join(packageDir, "preset"));
    await fse.copy(
      path.join(__dirname, "..", "presets", presetFile),
      path.join(packageDir, "preset", "index.js")
    );
    await fse.copy(
      path.join(__dirname, "..", "bin"),
      path.join(packageDir, "bin")
    );
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
