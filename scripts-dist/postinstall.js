const { runMainFromFirstFoundScript } = require('./utils');

const main = async () =>
  runMainFromFirstFoundScript(['../dist/bin/project', './setup']);

if (require.main === module) void main();

module.exports = { main };
