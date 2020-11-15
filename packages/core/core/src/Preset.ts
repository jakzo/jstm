import { Technology, TechDep } from './Technology';
import { Project } from './Project';

export class Preset {
  constructor(
    public name: string,
    public technologies: Technology<TechDep<unknown>[], unknown>[],
  ) {}

  async apply(projectDir: string) {
    const project = new Project(projectDir);
    for (const tech of this.technologies) {
      await tech.apply(project);
    }
  }
}
