const fse = require("fs-extra");
const fleece = require("golden-fleece");

exports.readFileOr = async (filePath, defaultValue) =>
  fse.readFile(filePath, "utf8").catch((err) => {
    if (err.code === "ENOENT") return defaultValue;
    throw err;
  });

const isObject = (value) => typeof value === "object" && value !== null;

// TODO: Add `defaultsToOverwrite` option so we can update values we added but
//       not values added by users
exports.mergeJson = async (filePath, properties, overwrite = false) => {
  const merge = (a, b) => {
    for (const [key, valueB] of Object.entries(b)) {
      if (Object.prototype.hasOwnProperty.call(a, key)) {
        const valueA = a[key];
        if (isObject(valueA) && isObject(valueB)) {
          merge(valueA, valueB);
        } else if (overwrite) {
          a[key] = valueB;
        }
      } else {
        a[key] = valueB;
      }
    }
    return a;
  };
  const contents = await exports.readFileOr(filePath, "{}");
  return fleece.patch(contents, merge(fleece.evaluate(contents), properties));
};
