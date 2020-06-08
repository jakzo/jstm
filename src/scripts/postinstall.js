const distScriptExists = () => {
  try {
    require.resolve('../../dist/bin/project');
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  if (distScriptExists()) await require('../../dist/bin/project').main();
  // When developing in the @jakzo/project repo there is no `dist` on first run of `yarn`
  // Path mangling is so that Typescript does not try to compile `setup.js`
  else await require('../../scripts/setup' + '').main();
};

if (require.main === module) void main();

module.exports = { main, distScriptExists };
