const distScriptExists = () => {
  try {
    require.resolve('../../dist/bin/project');
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  // Path mangling is so that Typescript does not try to these `require()`d files
  if (distScriptExists()) await require('../../dist/bin/project' + '').main();
  // When developing in the @jakzo/project repo there is no `dist` on first run of `yarn`
  else await require('../../scripts/setup' + '').main();
};

if (require.main === module) void main();

module.exports = { main, distScriptExists };
