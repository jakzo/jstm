export const findLastIndex = <T>(arr: T[], cb: (item: T, idx: number) => boolean) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (cb(arr[i], i)) return i;
  }
  return -1;
};
