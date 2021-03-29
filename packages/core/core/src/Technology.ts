import { Diff } from 'diff';

import { ProjectInfo } from './types';
export interface FileUpdate {
  /** Path to the file relative to the project root. */
  path: string;
  diff: Diff;
}

export interface ProjectChanges {
  /** Changes to make to files. This is performed first. */
  fileUpdates?: FileUpdate[];
  /** Commands to run in the project root. These are performed after file updates. */
  commands?: string[];
}

export interface TechnologyOpts<TechData, DepData> {
  /** Snake-case ID. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Technologies required to be installed before calling `installOrUpdate()` on this one. */
  dependencies: Technology<DepData, unknown>[];
  /** Installs the technology to the project and returns any data to merge into `projectInfo.techData`.
   * If the technology is already installed it is updated. */
  installOrUpdate: (projectInfo: ProjectInfo<DepData>) => Promise<TechData>;
}

export class Technology<TechData, DepData> {
  constructor(public opts: TechnologyOpts<TechData, DepData>) {}
}
