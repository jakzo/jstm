import path from 'path';
import { execSync } from 'child_process';
import { Technology } from '@jstm/core';

export interface NpmData {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export const npm = new Technology({
  id: 'npm',
  name: 'npm',
  templatesDir: path.join(__dirname, '..', 'templates'),
  dependencies: [],
  applyDependencyData(data: NpmData) {},
});
