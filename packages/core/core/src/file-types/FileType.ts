import path from 'path';

import fse from 'fs-extra';

/**
 * Describes modifications to a file.
 *
 * If it is an object, it is a map where each key is a key of the outputted value from the file.
 * The value of each property is another `FilePatch` describing modifications to make to the
 * outputted object's property.
 *
 * If it is an empty array, it signals that the property on the outputted object should be
 * deleted.
 *
 * If it is an array of one element, the element is the value that the property of the outputted
 * object should be set to.
 */
export type FilePatch<Data> =
  | FilePatchMap<Data>
  | FilePatchSet<Data>
  | FilePatchAppend<Data>
  | FilePatchDelete;
export type FilePatchMap<Data> = { [key: string]: FilePatch<Data> };
export type FilePatchSet<Data> = [FilePatchType.SET, Data];
export type FilePatchAppend<Data> = [FilePatchType.APPEND, Data];
export type FilePatchDelete = [FilePatchType.DELETE];
export enum FilePatchType {
  SET,
  APPEND,
  DELETE,
}

export interface FileOpts<Data, PatchData = Data> {
  /** Human-readable name of file type. */
  name: string;
  /** Converts file contents into a patchable data format specific to the file type. */
  deserialize(contents: string): Data;
  /** Makes a modification to some data. */
  patch(data: Data | undefined, patch: FilePatch<PatchData>): Data | undefined;
  /** Converts patchable data into file contents. */
  serialize(data: Data, contents: string | undefined): string | undefined;
}

export interface FileType<Data, PatchData> extends FileOpts<Data, PatchData> {}
export class FileType<Data, PatchData = Data> {
  constructor(opts: FileOpts<Data, PatchData>) {
    Object.assign(this, opts);
  }

  async applyPatches(
    projectPath: string,
    /** Path from project root to file. */
    relativeFilePath: string,
    patches: FilePatchMap<PatchData>[],
  ) {
    const filePath = path.join(projectPath, relativeFilePath);
    const contents = (await fse.pathExists(filePath))
      ? await fse.readFile(filePath, 'utf8')
      : undefined;
    const modifiedData = patches.reduce(
      (data, patch) => this.patch(data, patch),
      contents === undefined ? undefined : this.deserialize(contents),
    );
    if (modifiedData === undefined) await fse.unlink(filePath);
    else await fse.writeFile(filePath, this.serialize(modifiedData, contents));
  }
}
