import { getContext, log } from '../utils';

import getRules from './rules';
import getPlugins from './plugins';
import getResolve from './resolve';
import getEntry from './entry';

import pkg from '../../package.json';

export default (_ctx, defaults = {}) => {
  const context = getContext(_ctx);

  console.log(context.platform || 'fail');

  log({
    level: 'none',
    message: `
    -- Building Webpack Configuration --
    ------------------------------------
      App Name:      ${pkg.name} ${pkg.version}
      Environment:   ${context.env.NODE_ENV}
      Dependencies:  ${Object.keys(pkg.dependencies).length}
      -- Directories --
       Root:   ${context.dirs.root()}
       Public: ${context.dirs.public()}
       UI:     ${context.dirs.ui()}
    ------------------------------------
  `,
  });

  return {
    /*
      Webpack 4 Preset
    */
    mode: context.env.NODE_ENV === 'production' ? 'production' : 'development',

    context: context.dirs.ui(),

    devtool: 'inline-source-map',

    // target: 'web',

    entry: getEntry(context),

    output: {
      publicPath: '/',
      path: context.dirs.dist(),
      filename: context.isDev ? '[name].bundle.js' : '[name]-[chunkhash].js',
      chunkFilename: '[name]-[chunkhash].js',
      // hotUpdateChunkFilename: 'hot/hot-update.js',
      // hotUpdateMainFilename: 'hot/hot-update.json',
    },

    ...(context.isDev && {
      /**
       * Development-Server will only run when we are in the development
       * stage.
       */
      devServer: {
        port: 3000,
        compress: true,
        // noInfo: true,
        // https: true,
        stats: 'errors-only',
        inline: true,
        lazy: false,
        hot: true,
        bonjour: true,
        host: 'localhost',
        public: 'localhost:3000',
        publicPath: 'http://localhost:3000',
        // public: 'idex-test.turbulent.space:4000',
        // disableHostCheck: true,
        contentBase: context.dirs.public(),
        headers: {
          Accept: '*/*',
          'Access-Control-Allow-Origin': '*',
        },
        watchOptions: {
          aggregateTimeout: 300,
          ignored: /node_modules/,
          poll: 100,
        },
        overlay: {
          warnings: false,
          errors: true,
        },
        historyApiFallback: {
          verbose: true,
          disableDotRule: false,
        },
      },
    }),

    plugins: getPlugins(context),

    module: {
      strictExportPresence: true,
      rules: getRules(context),
    },

    resolve: getResolve(context),

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: false,
    },
  };
};
