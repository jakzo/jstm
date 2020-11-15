import { fileTypeJson } from '../Json';
import { FilePatchType } from '../FileType';

describe('patch()', () => {
  test('undefined', () => {
    expect(fileTypeJson.patch(undefined, [FilePatchType.SET, 1])).toEqual(1);
    expect(
      fileTypeJson.patch(undefined, [FilePatchType.SET, { some: { nested: { data: 8 } } }]),
    ).toEqual({ some: { nested: { data: 8 } } });
    expect(fileTypeJson.patch(undefined, [FilePatchType.APPEND, 1])).toEqual([1]);
    expect(fileTypeJson.patch(undefined, { x: [FilePatchType.SET, 1] })).toEqual({ x: 1 });
    expect(fileTypeJson.patch(undefined, [FilePatchType.DELETE])).toEqual(undefined);
    expect(fileTypeJson.patch(undefined, { x: [FilePatchType.DELETE] })).toEqual(undefined);
  });

  test('set', () => {
    expect(fileTypeJson.patch({ x: 1, y: 2 }, { x: [FilePatchType.SET, 9] })).toEqual({
      x: 9,
      y: 2,
    });
    expect(fileTypeJson.patch({ x: 1 }, { y: { z: [FilePatchType.SET, 9] } })).toEqual({
      x: 1,
      y: { z: 9 },
    });
    expect(fileTypeJson.patch({ x: 1 }, { x: { y: [FilePatchType.SET, 2] } })).toEqual({
      x: { y: 2 },
    });
    expect(
      fileTypeJson.patch(
        {
          a: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
          ],
        },
        { a: { 1: { x: [FilePatchType.SET, 9] } } },
      ),
    ).toEqual({
      a: [
        { x: 1, y: 2 },
        { x: 9, y: 4 },
      ],
    });
  });

  test('append', () => {
    expect(fileTypeJson.patch({ x: [1] }, { x: [FilePatchType.APPEND, 2] })).toEqual({
      x: [1, 2],
    });
    expect(fileTypeJson.patch({ x: 1, y: 2 }, { x: [FilePatchType.APPEND, 9] })).toEqual({
      x: [9],
      y: 2,
    });
  });

  test('combination', () => {
    expect(
      fileTypeJson.patch(
        {
          a: [1],
          b: 2,
          c: 3,
          d: 4,
        },
        { a: [FilePatchType.APPEND, 8], b: [FilePatchType.SET, 9], c: [FilePatchType.DELETE] },
      ),
    ).toEqual({
      a: [1, 8],
      b: 9,
      d: 4,
    });
    expect(
      fileTypeJson.patch(
        {},
        { a: { b: { c: [FilePatchType.DELETE], d: [FilePatchType.SET, 9] } } },
      ),
    ).toEqual({
      a: { b: { d: 9 } },
    });
    expect(
      fileTypeJson.patch(
        {},
        {
          a: {
            b: { c: [FilePatchType.DELETE], d: [FilePatchType.SET, 9] },
            x: { y: [FilePatchType.DELETE] },
          },
        },
      ),
    ).toEqual({
      a: { b: { d: 9 } },
    });
  });
});
