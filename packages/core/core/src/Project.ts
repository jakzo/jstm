import { ProjectIgnore } from './ProjectIgnore';

/** Represents a Javascript project. */
export class Project {
  ignored: ProjectIgnore;

  constructor(public path: string) {
    this.ignored = new ProjectIgnore(path);
  }
}
