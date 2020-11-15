import * as goldenFleece from 'golden-fleece';

import { FilePatch, FilePatchType, FileType } from './FileType';

type JsonObject = { [K in string]: JsonData };
export type JsonData = JsonObject | JsonData[] | string | number | boolean | null;

export const fileTypeJson = new FileType<JsonData>({
  name: 'JSON',
  deserialize: contents => goldenFleece.evaluate(contents) as JsonData,
  patch: (data, patch) => {
    /** Return result or `data` of `undefined` represents a non-present value. */
    const patchToData = (patch: FilePatch<JsonData>, data: JsonData | undefined) => {
      if (Array.isArray(patch)) {
        switch (patch[0]) {
          case FilePatchType.SET: {
            return patch[1];
          }
          case FilePatchType.APPEND: {
            if (Array.isArray(data)) {
              return [...data, patch[1]];
            }
            return [patch[1]];
          }
          case FilePatchType.DELETE: {
            return undefined;
          }
          default: {
            return data;
          }
        }
      }

      const result: JsonObject | JsonData[] = Array.isArray(data)
        ? [...data]
        : typeof data === 'object' && data !== null
        ? { ...data }
        : {};
      const isResultModified = Object.entries(patch).reduce(
        (isResultModified, [childKey, childPatch]) => {
          const childData =
            // Note that array indexes can be referenced in the patch object because JS converts
            // number keys to strings
            data !== undefined &&
            data !== null &&
            Object.prototype.hasOwnProperty.call(data, childKey)
              ? (data as JsonObject)[childKey]
              : undefined;
          const childResult = patchToData(childPatch, childData);
          if (childResult === undefined) {
            if (!Object.prototype.hasOwnProperty.call(result, childKey)) {
              return isResultModified;
            }
            delete (result as JsonObject)[childKey];
          } else {
            (result as JsonObject)[childKey] = childResult;
          }
          return true;
        },
        false,
      );
      if (!isResultModified) return data;
      return result;
    };

    return patchToData(patch, data);
  },
  serialize: (data, contents) =>
    contents === undefined ? goldenFleece.stringify(data) : goldenFleece.patch(contents, data),
});
