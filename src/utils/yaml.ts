import yaml, { YAMLMap, isMap } from "yaml";

// TODO: Add `defaultsToOverwrite` option so we can update values we added but
//       not values added by users
export const mergeYaml = async (
  contentsA: string,
  contentsB: string,
  overwrite = false
): Promise<string> => {
  const docB = yaml.parseDocument(contentsB);
  const b = docB.contents;
  if (!b) return contentsA;
  const docA = yaml.parseDocument(contentsA);
  const a = docA.contents;
  if (!a) return contentsB;
  if (!isMap(a) || !isMap(b)) return overwrite ? contentsB : contentsA;
  merge(a, b, overwrite);
  return docA.toString({ lineWidth: 0 });
};

const merge = (a: YAMLMap, b: YAMLMap, overwrite: boolean): void => {
  for (const { key: keyB, value: valueB } of b.items) {
    if (a.has(keyB)) {
      const valueA = a.get(keyB, true);
      if (isMap(valueA) && isMap(valueB)) {
        merge(valueA, valueB, overwrite);
      } else if (overwrite) {
        a.set(keyB, valueB);
      }
    } else {
      a.set(keyB, valueB);
    }
  }
};
