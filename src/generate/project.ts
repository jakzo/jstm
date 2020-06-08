import path from 'path';

import fse from 'fs-extra';
import * as prettier from 'prettier';

import { PackageJson, ProjectInfo } from '../types';
import { generateIgnoreFile, generateNpmignore, getIgnoredOrCreate } from './gitignore';
import { generateBaseTsconfig, generateBuildTsconfig } from './typescript';

export const getProjectInfo = (packageJson: PackageJson): ProjectInfo => {
  const {
    project: {
      srcFilePatterns = ['/src'],
      testFilePatterns = ['__*__'],
      buildDirectory = './dist',
    } = {},
  } = packageJson;
  return {
    srcFilePatterns,
    testFilePatterns,
    buildDirectory,
  };
};

export const addGeneratedScripts = async (packageJsonPath: string, packageJson: PackageJson) => {
  const generatedScripts = {
    '=== Generated Scripts (do not modify) ===': '',
    build: 'tsc -p ./tsconfig.build.json',
    'build:watch': 'yarn build -w',
    lint: 'yarn lint:eslint && yarn lint:prettier',
    'lint:fix': 'yarn lint:eslint --fix && yarn lint:prettier --write',
    'lint:eslint': 'eslint --ext js,jsx,ts,tsx ./',
    'lint:prettier': 'prettier -c "./**/*{.json,.md}"',
    test: 'jest',
    'test:watch': 'yarn test --watch',
    '=== (end generated scripts) ===': '',
    '': '',
  };

  packageJson.scripts = Object.assign(
    generatedScripts,
    ...Object.entries(packageJson.scripts || {}).map(([key, value]) =>
      key in generatedScripts ? undefined : { [key]: value },
    ),
  ) as Record<string, string>;
  await fse.writeFile(
    packageJsonPath,
    prettier.format(JSON.stringify(packageJson), { filepath: 'package.json' }),
  );
};

export const initProject = async (projectDir: string, recreateGitignore: boolean) => {
  const packageJsonPath = path.join(projectDir, 'package.json');
  const packageJson = (await fse.readJson(packageJsonPath)) as PackageJson;
  const projectInfo = getProjectInfo(packageJson);

  const ignored = await getIgnoredOrCreate(path.join(projectDir, '.gitignore'), recreateGitignore);

  const templateDir = path.join(__dirname, '..', '..', 'templates');
  await fse.copy(templateDir, projectDir, { overwrite: true });

  await Promise.all([
    fse.writeFile(path.join(projectDir, 'tsconfig.json'), generateBaseTsconfig(ignored)),
    fse.writeFile(path.join(projectDir, 'tsconfig.build.json'), generateBuildTsconfig(projectInfo)),
    fse.writeFile(path.join(projectDir, '.prettierignore'), generateIgnoreFile(ignored)),
    fse.writeFile(path.join(projectDir, '.eslintignore'), generateIgnoreFile(ignored)),
    fse.writeFile(path.join(projectDir, '.npmignore'), generateNpmignore(ignored, projectInfo)),
  ]);

  await addGeneratedScripts(packageJsonPath, packageJson);
};
