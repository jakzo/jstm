import path from "path";

import type { TemplateGenerator } from "../types";
import { mergeJson } from "../utils";
import { getMainBranch } from "./utils/config";

export const packageGen: TemplateGenerator = {
  devDependencies: [
    "@changesets/cli",
    "@changesets/get-release-plan",
    "@changesets/release-utils",
  ],
  files: async ({ config }) => [
    {
      path: [".changeset", "config.json"],
      isCheckedIn: true,
      contents: await mergeJson(path.join(".changeset", "config.json"), {
        $schema: "https://unpkg.com/@changesets/config@1.4.0/schema.json",
        changelog: "@changesets/cli/changelog",
        commit: true,
        linked: [],
        access: "public",
        baseBranch: await getMainBranch(config),
        updateInternalDependencies: "patch",
        ignore: [],
      }),
    },
  ],
};
