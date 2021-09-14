const { spawnSync } = require("child_process");
const path = require("path");

const fse = require("fs-extra");
const tempy = require("tempy");
const tsNode = require("ts-node");
const tsconfigPaths = require("tsconfig-paths");

exports.registerTsNode = (rootDir) => {
  if (process[tsNode.REGISTER_INSTANCE]) return;
  tsNode.register({
    transpileOnly: true,
    skipProject: true,
    compilerOptions: { esModuleInterop: true, downlevelIteration: true },
  });
  tsconfigPaths.register({
    baseUrl: rootDir,
    paths: {
      "@jstm/core": ["./src"],
    },
  });
};

exports.getRootDir = () => {
  if (process.env.JSTM_TEST_ROOT) return process.env.JSTM_TEST_ROOT;
  let rootDir = __dirname;
  while (!fse.existsSync(path.join(rootDir, "stub-packages"))) {
    const nextRootDir = path.join(rootDir, "..");
    if (nextRootDir === rootDir) throw new Error("could not find root dir");
    rootDir = nextRootDir;
  }
  return rootDir;
};

exports.setup = () => {
  const rootDir = exports.getRootDir();
  exports.registerTsNode(rootDir);
  return rootDir;
};

exports.bin = async (binName) => {
  try {
    const scriptExists = (filePath) => {
      try {
        require.resolve(filePath);
        return true;
      } catch {
        return false;
      }
    };

    const rootDir = exports.setup();
    process.chdir(process.env.INIT_CWD || rootDir);

    const installedBinContents = await fse.readFile(__filename, "utf8");
    const stubBinContents = await fse.readFile(
      path.join(rootDir, "stub-packages", "preset", path.basename(__filename)),
      "utf8"
    );
    if (installedBinContents !== stubBinContents) {
      console.log(
        "Linked binaries are out of sync with stub package. Reinstalling..."
      );
      spawnSync("yarn", ["install"], { stdio: "inherit" });
      console.log(
        "Reinstall complete. This command will now fail. Please run it again."
      );
      throw new Error("command stopped because stub package was out of sync");
    }

    exports.redirectPresetImports(rootDir);

    const binPath = path.join(rootDir, "presets", "template", binName);
    if (!scriptExists(binPath))
      throw new Error(`binary not found at: ${binPath}`);
    require(binPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

exports.redirectPresetImports = (rootDir) => {
  const presetDirName = path.basename(__dirname);
  if (presetDirName === "preset")
    throw new Error("this can only be run from an installed node module");

  const presetPath = path.join(
    rootDir,
    "presets",
    presetDirName.replace(/^preset-/, "")
  );
  const presetPackageJson =
    require(`${rootDir}/scripts/generate-preset-packages`).getPackageJson(
      require(path.join(rootDir, "package.json")),
      require(presetPath).default
    );
  const presetPackageJsonTempPath = tempy.writeSync(
    JSON.stringify({ ...presetPackageJson, name: undefined }, null, 2),
    { extension: "json" }
  );
  const moduleMappings = {
    // Empty /presets/template/package.json -> Temporary generated preset package.json
    [path.join(path.join(rootDir, "presets", "template", "package.json"))]:
      presetPackageJsonTempPath,
    // Template imports to /presets/node -> /presets/${installedNodeModulePresetName}
    [path.join(rootDir, "presets", "node")]: presetPath,
  };
  const Module = require("module");
  const originalResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, parent) {
    const fullRequestPath = Module.builtinModules.includes(request)
      ? undefined
      : request.startsWith(".")
      ? path.join(parent.path, request)
      : request;
    return originalResolveFilename.apply(this, [
      moduleMappings[fullRequestPath] || request,
      ...Array.prototype.slice.call(arguments, 1),
    ]);
  };
};

exports.teardown = () => {
  // Unregister ts-node to avoid conflicts with ts-jest, etc.
  delete require.extensions[".ts"];
};
