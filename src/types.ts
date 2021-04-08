import type { PackageJson } from "type-fest";

import type { Config } from "./config";

export type MaybePromise<T> = T | Promise<T>;

export interface Formatter {
  (filename: string, contents: string): string;
}

export interface Preset {
  name: string;
  useCase: string;
  generators: TemplateGenerator[];
  formatter?: Formatter;
}

export interface TemplateGenerator {
  devDependencies?: string[];
  files: (vars: Vars) => MaybePromise<TemplateFile[]>;
}

export interface TemplateFile {
  path: string[];
  isCheckedIn?: boolean;
  isExecutable?: boolean;
  doNotOverwrite?: boolean;
  doNotTrim?: boolean;
  contents: string | ((vars: ContentsVars) => MaybePromise<string>);
}

export interface Vars {
  config: Config;
  presetPackageJson: PackageJson;
  packageJson: PackageJson;
}
export interface ContentsVars {
  gitignorePatterns: string[];
}
