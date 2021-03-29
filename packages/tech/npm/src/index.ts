import path from 'path';

import { Technology } from '@jstm/core';
import { ProjectInfo } from '@jstm/core/src/types';
import { exec } from '@jstm/core/src/util/exec';
import fse from 'fs-extra';

export interface NpmStylePackageManagerData {
  hasNpmStylePackageManager: boolean;
  addNpmDep: (packageNames: string[], isDevDep?: boolean) => Promise<void>;
}
export interface NpmData extends NpmStylePackageManagerData {}

export const npm = new Technology({
  id: 'npm',
  name: 'npm',
  dependencies: [],
  async installOrUpdate(projectInfo): Promise<NpmData> {
    const hasNpmStylePackageManager = await fse
      .readFile(path.join(projectInfo.path, 'package.json'), 'utf8')
      .then(contents => {
        const data = JSON.parse(contents);
        return 'name' in data && 'version' in data;
      })
      .catch(() => false);
    const addNpmDep = async (packageNames: string[], isDevDep?: boolean) =>
      exec('npm', ['install', ...(isDevDep ? ['--save-dev'] : []), ...packageNames]);
    if (!hasNpmStylePackageManager) await exec('npm', ['init', '-y']);
    return {
      hasNpmStylePackageManager,
      addNpmDep,
    };
  },
});

export const requireNpmStylePackageManager = (
  projectInfo: ProjectInfo<NpmStylePackageManagerData>,
) => {
  if (projectInfo.techData.hasNpmStylePackageManager) return;
  throw new Error('npm style package manager is required');
};
