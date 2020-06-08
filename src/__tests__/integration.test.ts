import path from 'path';

import fse from 'fs-extra';

import { initProject } from '..';

interface FileTree {
  [filename: string]: string | FileTree;
}

const readFilesIntoObject = async (dir: string): Promise<FileTree> =>
  Object.assign(
    {},
    ...(await Promise.all(
      (await fse.readdir(dir, { withFileTypes: true })).map(async entry => {
        const entryPath = path.join(dir, entry.name);
        return {
          [entry.name]: await (entry.isDirectory()
            ? readFilesIntoObject(entryPath)
            : fse.readFile(entryPath, 'utf8')),
        };
      }),
    )),
  ) as FileTree;

const integrationFixtureDir = path.join(__dirname, '__fixtures__', 'integration');

test('basic', async () => {
  const projectPath = path.join(integrationFixtureDir, 'basic');
  await fse.emptyDir(projectPath);
  await fse.writeJson(path.join(projectPath, 'package.json'), {});

  await initProject(projectPath, true);

  const output = await readFilesIntoObject(projectPath);
  expect(output).toMatchSnapshot();
});

test('no package.json', async () => {
  const projectPath = path.join(integrationFixtureDir, 'no-package-json');
  await fse.emptyDir(projectPath);

  await expect(async () => initProject(projectPath, true)).rejects.toBeTruthy();
});
