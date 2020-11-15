import fse from 'fs-extra';

import { Project } from './Project';
import { CustomIgnoreFiles } from './ProjectIgnore';

export interface TechDepOpts<Data> {
  tech: Technology<TechDep<unknown>[], Data>;
  isRequired?: boolean;
  data?: Data;
}
export class TechDep<Data> {
  constructor(public opts: TechDepOpts<Data>) {}
}
export const d = <Data>(opts: TechDepOpts<Data>) => new TechDep(opts);

export interface TechnologyOpts<TechDeps extends TechDep<unknown>[], Data> {
  /** Snake-case ID. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Absolute path to directory containing files to be copied as-is into the project. */
  templatesDir?: string;
  /** Ignore files to create. */
  customIgnoreFiles?: CustomIgnoreFiles;
  /** Resources and data used specific to other technologies in the project. */
  dependencies: TechDeps;
  /** Applies data from other technologies depending on this one. */
  applyDependencyData: (deps: Data) => void;
}

export class Technology<TechDeps extends TechDep<unknown>[], Data> {
  constructor(public opts: TechnologyOpts<TechDeps, Data>) {}

  async apply(project: Project) {
    const previousVersion = undefined;
    if (!previousVersion) {
      if (this.opts.templatesDir) {
        // TODO: If file exists, apply patches instead of overwriting
        await fse.copy(this.opts.templatesDir, project.path, { overwrite: true });
      }
    } else {
      // TODO
    }
  }
}

export type DataOf<T extends Technology<TechDep<unknown>[], unknown>> = T extends Technology<
  TechDep<unknown>[],
  infer Data
>
  ? Data
  : never;
