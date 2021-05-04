const { spawnSync } = require("child_process");
const path = require("path");

const fse = require("fs-extra");
const tsNode = require("ts-node");

exports.registerTsNode = () => {
  if (process[tsNode.REGISTER_INSTANCE]) return;
  tsNode.register({
    transpileOnly: true,
    skipProject: true,
    compilerOptions: { esModuleInterop: true, downlevelIteration: true },
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
      path.join(rootDir, "stub-packages", "core", path.basename(__filename)),
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

    const binPath = path.join(rootDir, "src", "bin", binName);
    if (!scriptExists(binPath))
      throw new Error(`binary not found at: ${binPath}`);
    require(binPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
