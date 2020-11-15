import * as prettier from 'prettier';

import { ProjectInfo } from '../types';
import { IgnoredFiles } from '../ProjectIgnore';
import tsconfig from './tsconfig.base.json';

export const gitignorePatternToTypescriptGlobs = (pattern: string) => {
  // TODO: What should we do about negative matches?
  if (pattern.startsWith('!')) return [];
  const prefix = pattern.startsWith('/') ? '.' : '**/';
  const suffix = pattern.endsWith('**') ? '/*' : '';
  return [
    prefix + pattern + suffix,
    ...(pattern.endsWith('*') ? [] : [prefix + pattern + '/**/*']),
  ];
};

export const generateBaseTsconfig = (ignored: IgnoredFiles) =>
  prettier.format(
    `// DO NOT MODIFY
// This file is auto-generated
${JSON.stringify({
  ...tsconfig,
  exclude: Object.values(ignored).flatMap(category =>
    category.patterns.flatMap(gitignorePatternToTypescriptGlobs),
  ),
})}`,
    { filepath: 'tsconfig.json' },
  );

export const generateBuildTsconfig = (projectInfo: ProjectInfo) =>
  prettier.format(
    `// DO NOT MODIFY
// This file is auto-generated
${JSON.stringify({
  extends: './tsconfig.json',
  include: projectInfo.srcFilePatterns.flatMap(pattern => {
    const globs = gitignorePatternToTypescriptGlobs(pattern);
    return [...globs, globs[1] + '.json'];
  }),
  exclude: projectInfo.testFilePatterns.flatMap(gitignorePatternToTypescriptGlobs),
  compilerOptions: {
    // TODO: Set rootDir to nearest common ancestor
    rootDir: gitignorePatternToTypescriptGlobs(projectInfo.srcFilePatterns[0])[0],
    outDir: projectInfo.buildDirectory,
    types: tsconfig.compilerOptions.types.filter(value => value !== 'jest'),
  },
})}`,
    { filepath: 'tsconfig.json' },
  );
