/**
 * This is simply used to transform and call the standard webpack.config.js
 */
require('@babel/register');
const getWebpackConfig = require('./webpack.config').default;

module.exports = getWebpackConfig;
