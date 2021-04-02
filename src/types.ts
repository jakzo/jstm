import type { PackageJson } from "type-fest";

export type MaybePromise<T> = T | Promise<T>;

export interface Preset {
  name: string;
  useCase: string;
  generators: TemplateGenerator[];
  formatter?: (filename: string, contents: string) => string;
}

export interface TemplateGenerator {
  devDependencies?: string[];
  files: (vars: Vars) => MaybePromise<TemplateFile[]>;
}

export interface TemplateFile {
  path: string[];
  isCheckedIn?: boolean;
  doNotOverwrite?: boolean;
  doNotTrim?: boolean;
  contents: string | ((vars: ContentsVars) => MaybePromise<string>);
}

export interface Vars {
  presetPackageJson: PackageJson;
  packageJson: PackageJson;
  packageName: string;
  description?: string;
  nodeTargetVersion: number;
  nodeMinVersion: number;
  srcDir: string;
  distDir: string;
}
export interface ContentsVars {
  gitignorePatterns: string[];
}
