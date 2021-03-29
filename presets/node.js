const path = require("path");

const prettier = require("prettier");

const { default: common } = require("../dist/generators/common");
const { default: package } = require("../dist/generators/package");
const { default: eslint } = require("../dist/generators/eslint");
const { default: typescript } = require("../dist/generators/typescript");

const formatWithPrettier = (filename, contents) => {
  const fileExt = path.extname(filename);
  const parser = Object.entries({
    angular: [],
    "babel-flow": [".js", ".jsx"],
    "babel-ts": [],
    babel: [],
    css: [".css"],
    espree: [],
    flow: [],
    glimmer: [],
    graphql: [".graphql"],
    html: [".html", ".htm"],
    json: [".json"],
    json5: [],
    less: [],
    lwc: [],
    markdown: [".md"],
    mdx: [],
    meriyah: [],
    scss: [],
    typescript: [".ts", ".tsx"],
    vue: [],
    yaml: [".yaml", ".yml"],
  }).find(([, extensions]) => extensions.includes(fileExt))?.[0];
  if (!parser) return contents;
  return prettier.format(contents, { parser });
};

exports.default = {
  name: "node",
  useCase: "node packages",
  generators: [common, package, eslint, typescript],
  formatter: formatWithPrettier,
};
