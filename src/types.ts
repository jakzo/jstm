import * as tf from 'type-fest';

export interface ProjectInfo {
  /** List of paths from package.json to source directories. Defaults to `["./src/"]`. */
  srcDirs: string[];
  /** Gitignore style globs matching test files. Defaults to `["__*__"]`. */
  testFilePatterns: string[];
}

export interface PackageJson extends tf.PackageJson {
  /** Information about project for generating boilerplate. */
  project?: Partial<ProjectInfo>;
}
