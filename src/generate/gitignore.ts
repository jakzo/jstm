import fse from 'fs-extra';

import { ProjectInfo } from '../types';
import { IgnoredFiles, generateIgnored } from './ignored-files';

export const suffixPatternWithDescendents = (pattern: string) =>
  pattern.endsWith('*') ? pattern : pattern.endsWith('/') ? pattern + '**' : pattern + '/**';

export const generateGitignore = (
  ignoredFiles: IgnoredFiles,
) => `# DO NOT CHANGE THE STRUCTURE OF THIS FILE
# You may add extra patterns but do not change the "=== HEADING ===" comments or provided patterns

${Object.values(ignoredFiles)
  .map(({ rawLines }) => rawLines.join('\n'))
  .join('\n\n')}
`;

export const getIgnoredFromGitignore = async (gitignorePath: string) => {
  const contents = await fse.readFile(gitignorePath, 'utf8');
  const ignored = generateIgnored();

  const state = { category: ignored.other, isDescriptionComment: true };
  for (const line of contents.split('\n')) {
    const lineTrimmed = line.trim();
    const heading = /^#\s*===\s+(.+)\s+===$/.exec(lineTrimmed)?.[1];
    if (heading) {
      state.category.trim();
      state.category =
        Object.values(ignored).find(category => category.heading === heading) || ignored.other;
      state.isDescriptionComment = true;
    } else {
      if (state.isDescriptionComment && lineTrimmed.startsWith('#')) continue;
      state.isDescriptionComment = false;
      state.category.addLine(line);
    }
  }
  state.category.trim();

  await fse.writeFile(gitignorePath, generateGitignore(ignored));
  return ignored;
};

export const getIgnoredOrCreate = async (gitignorePath: string, forceRecreate = false) => {
  if (!forceRecreate && (await fse.pathExists(gitignorePath))) {
    return getIgnoredFromGitignore(gitignorePath);
  }

  const ignored = generateIgnored();
  await fse.writeFile(gitignorePath, generateGitignore(ignored));
  return ignored;
};

/** Generates and writes an ignore file. Does not include overrides. */
export const generateIgnoreFile = (
  ignoredFiles: IgnoredFiles,
  excludedCategories: (keyof IgnoredFiles)[] = [],
) =>
  `# DO NOT MODIFY
# This file is generated based on .gitignore -- modify that file instead then run \`yarn install\`

${Object.entries(ignoredFiles)
  .filter(([name]) => !(excludedCategories as string[]).includes(name))
  .map(
    ([_name, { heading, description, patterns }]) => `# === ${heading} ===
${description.map(line => '# ' + line).join('\n')}
${patterns.join('\n').trim()}`,
  )
  .join('\n\n')}
`;

export const generateNpmignore = (
  ignoredFiles: IgnoredFiles,
  projectInfo: ProjectInfo,
) => `# Ignore all files and make exceptions only for required files
**

# Include package files
!/package.json
!/README.md
!/CHANGELOG.md

# Include build files
${ignoredFiles.build.patterns
  .map(pattern => '!' + suffixPatternWithDescendents(pattern))
  .join('\n')}

# Include source files (so that source maps work)
${projectInfo.srcFilePatterns
  .map(pattern => '!' + suffixPatternWithDescendents(pattern))
  .join('\n')}

# Remove test files from source
${projectInfo.testFilePatterns.join('\n')}
`;
