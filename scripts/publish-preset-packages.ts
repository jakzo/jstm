import { spawnSync } from "child_process";
import path from "path";

import * as fse from "fs-extra";
import { PackageJson } from "type-fest";

import corePackageJson from "../package.json";

const main = async (): Promise<void> => {
  // This is set because when running a script with Yarn but will cause publish to fail
  if (process.env.npm_config_registry === "https://registry.yarnpkg.com")
    delete process.env.npm_config_registry;

  const packagesDir = path.join(__dirname, "..", "presets", "packages");
  for (const entry of await fse.readdir(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    // Update package.json version since @jstm/core's package.json version may have been bumped
    const packageDir = path.join(packagesDir, entry.name);
    const packageJsonPath = path.join(packageDir, "package.json");
    const packageJson = (await fse.readJson(packageJsonPath)) as PackageJson;
    packageJson.version = corePackageJson.version;
    await fse.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    spawnSync("npm", ["publish", "--access", "public", packageDir], {
      stdio: "inherit",
    });
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
