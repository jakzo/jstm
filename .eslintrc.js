const tsNode = require('ts-node');

if (!process[tsNode.REGISTER_INSTANCE]) tsNode.register();

module.exports = require('./src/config/eslint').config;
