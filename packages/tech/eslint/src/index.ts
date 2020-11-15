import path from 'path';
import { Technology, d } from '@jstm/core';
import { npm } from '../../npm/src';

export const eslint = new Technology({
  id: 'eslint',
  name: 'ESLint',
  templatesDir: path.join(__dirname, '..', 'templates'),
  dependencies: [
    d({
      tech: npm,
      data: {
        devDependencies: {
          eslint: '*',
        },
      },
    }),
  ],
  applyDependencyData() {},
});
