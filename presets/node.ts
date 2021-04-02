import { Preset, generators, prettierFormatter } from "@jstm/core";

const preset: Preset = {
  name: "node",
  useCase: "node packages",
  generators: [
    generators.common,
    generators.packageGen,
    generators.eslint,
    generators.typescript,
  ],
  formatter: prettierFormatter,
};

export default preset;
