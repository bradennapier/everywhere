/* eslint global-require: 0, import/no-dynamic-require: 0 */

import webpack from 'webpack';

/* Webpack Plugins */
import HTMLWebpackPlugin from 'html-webpack-plugin';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import OptimizeJSPlugin from 'optimize-js-plugin';

export default context =>
  [
    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * For Optimized Hashing, we need to modify the hashing methods that
     * webpack utilizes.  This allows us to handle caching in a way that
     * will benefit the user and server-load as much as possible.
     *
     * When running in development we want to use NamedModulePlugin as it
     * will give us more context about the files may be throwing errors or
     * having issues.
     *
     * Reference:
     * https://webpack.js.org/guides/caching/#deterministic-hashes
     */
    context.isDev ? new webpack.NamedModulesPlugin() : new webpack.HashedModuleIdsPlugin(),

    /**
     * When building for development, we will use some extra plugins which
     * will be merged into the plugins Array.
     */
    context.isDev && [
      /**
       * https://webpack.js.org/concepts/hot-module-replacement/
       */
      new webpack.HotModuleReplacementPlugin({
        // @TODO: Waiting on https://github.com/jantimon/html-webpack-plugin/issues/533
        // multiStep: true
      }),
    ],

    context.isProd && [
      new UglifyJSPlugin({
        sourceMap: true,
        compress: {
          warnings: false,
          screw_ie8: true,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: false,
          screw_ie8: true,
        },
      }),

      new ExtractTextPlugin({
        filename: '[name].css',
        allChunks: true,
      }),

      // cleans the dist directory if it exists (removes)
      new CleanWebpackPlugin(['dist']),

      // This will wrap all immediately invoked functions in () to speed up
      // initial execution by as much as 30%.  It should perhaps be only set
      // when in production
      new OptimizeJSPlugin({
        sourceMap: true,
      }),
    ],

    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(context.env.NODE_ENV),
      },
    }),

    // technically depreciated - some older plugins may still listen
    // for these so we include it.
    new webpack.LoaderOptionsPlugin({
      minimize: context.isProd,
      debug: context.isProd,
    }),

    new HTMLWebpackPlugin({
      inject: true,
      template: context.files.template(),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),

    // new AutoDllPlugin({
    //   inject: true,
    //   debug: true,
    //   filename: '[name]_[hash].js',
    //   path: 'dist/dll',
    //   entry: {
    //     vendor: Object.keys(dependencies),
    //   },
    // }),

    new LodashModuleReplacementPlugin({
      paths: true,
    }),

    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'manifest',
    //   minChunks: Infinity,
    // }),

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ]
    .filter(Boolean)
    .reduce((p, a) => (Array.isArray(a) ? [...p, ...a] : [...p, a]), []);
