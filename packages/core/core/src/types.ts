import { Dirent } from 'fs-extra';

declare module 'fs-extra' {
  export function readdir(
    path: string | Buffer,
    options: { withFileTypes: true },
  ): Promise<Dirent[]>;
}

export interface ProjectInfo<TechData> {
  /** Absolute path to the root directory of the project. */
  path: string;
  /** Gitignore style globs matching source files. Defaults to `["/src"]`. */
  srcFilePatterns: string[];
  /** Gitignore style globs matching test files. Defaults to `["__*__"]`. */
  testFilePatterns: string[];
  /** Relative path to the output build directory. Defaults to `./dist`. */
  buildDirectory: string;
  techData: TechData;
}
