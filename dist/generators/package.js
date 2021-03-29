const path = require("path");

const { mergeJson } = require("../utils");

exports.default = {
  devDependencies: [
    "@changesets/cli",
    "@changesets/get-release-plan",
    "@changesets/release-utils",
  ],
  files: async ({}) => [
    {
      path: [".changeset", "config.json"],
      isCheckedIn: true,
      contents: await mergeJson(path.join(".changeset", "config.json"), {
        $schema: "https://unpkg.com/@changesets/config@1.4.0/schema.json",
        changelog: "@changesets/cli/changelog",
        commit: true,
        linked: [],
        access: "public",
        baseBranch: "master",
        updateInternalDependencies: "patch",
        ignore: [],
      }),
    },
  ],
};
