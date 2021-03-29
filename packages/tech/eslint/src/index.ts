import path from 'path';
import { Technology } from '@jstm/core';
import { npm } from '../../npm/src';

export const eslint = new Technology({
  id: 'eslint',
  name: 'ESLint',
  dependencies: [npm],
  async changesToSync(projectInfo) {
    if (isNpmStyleProject(projectInfo)) {
      return {
        commands: [projectInfo.techData.addNpmDeps(['eslint'], true)],
      };
    }
    throw new Error('npm style package manager is required');
  },
});
