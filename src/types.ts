import type { PackageJson } from "type-fest";

import type { Config } from "./config";

export type MaybePromise<T> = T | Promise<T>;

export interface Formatter {
  (filename: string, contents: string): MaybePromise<string>;
}

export interface Preset {
  name: string;
  /** Generated description is: `Preconfigured project tooling for ${useCase}.` */
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

export interface TemplateFileBuilt extends TemplateFile {
  contents: string;
  existingContents?: string;
}

export interface Vars {
  config: Config;
  presetPackageJson: PackageJson;
  packageJson: PackageJson;
  devDependencies: Record<string, string>;
}
export interface ContentsVars {
  gitignorePatterns: string[];
  files: TemplateFile[];
}
