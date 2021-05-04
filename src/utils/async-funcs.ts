export const asyncMap = async <T, U>(
  arr: T[],
  func: (item: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> => {
  const result = [];
  for (const [i, item] of arr.entries()) result.push(await func(item, i, arr));
  return result;
};

export const asyncFilter = async <T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> => {
  const result: T[] = [];
  for (const [index, value] of array.entries()) {
    if (await predicate(value, index, array)) result.push(value);
  }
  return result;
};
