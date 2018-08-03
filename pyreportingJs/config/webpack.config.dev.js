'use strict';

const merge = require('webpack-merge');

// needs to be set before importing from webpack.config.base
process.env.NODE_ENV = 'development';

const { baseConfig, env } = require('./webpack.config.base');

const devConfig = {
  // Turn off performance hints during development because we don't do any
  // splitting or minification in interest of speed. These warnings become
  // cumbersome.
  performance: {
    hints: false,
  },

  // Do not show ESLint warnings in console
  stats: {
    warnings: false,
  },
};

module.exports = merge(baseConfig, devConfig);
