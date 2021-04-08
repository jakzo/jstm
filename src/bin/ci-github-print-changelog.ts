import { getChangelogEntry } from "@changesets/release-utils";
import * as fse from "fs-extra";
import { PackageJson } from "type-fest";

export const main = async (): Promise<void> => {
  const changelog = await fse.readFile("CHANGELOG.md", "utf8");
  const { version } = (await fse.readJson("package.json")) as PackageJson;
  if (!version) throw new Error("version missing from package.json");
  const { content } = getChangelogEntry(changelog, version);
  console.log(
    content.replace(
      /[%\r\n]/g,
      (ch) =>
        `'%${ch.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()}'`
    )
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
