import path from "path";

import type { PackageJson } from "type-fest";

import type {
  Config,
  ConfigOpts,
  ConfigTypeNames,
  ConfigTypeOf,
} from "../../config";

const createConfigGetter =
  <T extends ConfigTypeNames, A extends unknown[]>(
    key: string,
    type: T,
    f: (...args: A) => { value?: ConfigTypeOf<T> } & ConfigOpts<T>
  ) =>
  async (config: Config, ...args: A) => {
    const { value, ...opts } = f(...args);
    if (value !== undefined) return value;
    return config.get(key, type, opts);
  };

export const getPackageName = createConfigGetter(
  "packageName",
  "string",
  (packageJson: PackageJson, isMonorepo) => ({
    hint: isMonorepo
      ? "name of the unpublished monorepo root package"
      : undefined,
    value: packageJson.name,
    defaultValue: isMonorepo
      ? `@${path.basename(process.cwd())}/monorepo`
      : path.basename(process.cwd()),
    shouldNotSave: true,
  })
);

export const getDescription = createConfigGetter(
  "description",
  "string",
  (packageJson: PackageJson) => ({
    value: packageJson.description,
    shouldNotSave: true,
  })
);

export const getRepoUrl = createConfigGetter(
  "repoUrl",
  "string",
  (packageName: string) => {
    const nameParts = packageName.replace("@", "").split("/");
    return {
      defaultValue:
        nameParts.length >= 2
          ? `https://github.com/${nameParts.slice(0, 2).join("/")}`
          : undefined,
      shouldNotSave: true,
    };
  }
);

export const getPackageJsonAuthor = createConfigGetter(
  "packageJsonAuthor",
  "string",
  () => ({ shouldNotSave: true })
);

export const getLicense = createConfigGetter(
  "license",
  "string",
  (packageJson: PackageJson) => ({
    value: packageJson.license,
    defaultValue: "MIT",
    shouldNotSave: true,
  })
);

export const getMainBranch = createConfigGetter("mainBranch", "string", () => ({
  defaultValue: "master",
}));

export const getSrcDir = createConfigGetter("srcDir", "string", () => ({
  defaultValue: "src",
}));

export const getDistDir = createConfigGetter("distDir", "string", () => ({
  defaultValue: "dist",
}));

export const getNodeMinVersion = createConfigGetter(
  "nodeMinVersion",
  "number",
  () => ({ defaultValue: 10 })
);

export const getNodeTargetVersion = createConfigGetter(
  "nodeTargetVersion",
  "number",
  () => ({ defaultValue: 14 })
);

export const getNpmRegistry = createConfigGetter(
  "npmRegistry",
  "string",
  () => ({ defaultValue: "https://registry.npmjs.org" })
);

export const getNpmAccess = createConfigGetter("npmAccess", "string", () => ({
  defaultValue: "public",
  shouldNotSave: true,
}));

export const getIsMonorepo = createConfigGetter(
  "isMonorepo",
  "boolean",
  () => ({ defaultValue: false })
);

export const getSubpackageName = createConfigGetter(
  "subpackageName",
  "string",
  (rootPackageName: string) => ({
    hint: "name of the initial package within the monorepo",
    defaultValue: rootPackageSubName(rootPackageName, "sample"),
    shouldNotSave: true,
  })
);

export const getSubpackageDescription = createConfigGetter(
  "subpackageDescription",
  "string",
  (packageJson: PackageJson) => ({
    value: packageJson.description,
    shouldNotSave: true,
  })
);

const rootPackageSubName = (
  rootPackageName: string,
  subname: string
): string => {
  const match = /^@[^/]+/.exec(rootPackageName);
  if (match) return `${match[0]}/${subname}`;
  return `${rootPackageName}-${subname}`;
};
