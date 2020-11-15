import { Dirent } from 'fs-extra';
import * as tf from 'type-fest';

declare module 'fs-extra' {
  export function readdir(
    path: string | Buffer,
    options: { withFileTypes: true },
  ): Promise<Dirent[]>;
}

export interface ProjectInfo {
  /** Gitignore style globs matching source files. Defaults to `["/src"]`. */
  srcFilePatterns: string[];
  /** Gitignore style globs matching test files. Defaults to `["__*__"]`. */
  testFilePatterns: string[];
  /** Relative path to the output build directory. Defaults to `./dist`. */
  buildDirectory: string;
}

export interface PackageJson extends tf.PackageJson {
  /** Information about project for generating tooling. */
  project?: Partial<ProjectInfo>;
}
