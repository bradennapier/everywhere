// // Include an alternative client for WebpackDevServer. A client's job is to
//     // connect to WebpackDevServer by a socket and get notified about changes.
//     // When you save a file, the client will either apply hot updates (in case
//     // of CSS changes), or refresh the page (in case of JS changes). When you
//     // make a syntax error, this client will display a syntax error overlay.
//     // Note: instead of the default WebpackDevServer client, we use a custom one
//     // to bring better experience for Create React App users. You can replace
//     // the line below with these two lines if you prefer the stock client:
//     // require.resolve('webpack-dev-server/client') + '?/',
//     // require.resolve('webpack/hot/dev-server'),
//     require.resolve('react-dev-utils/webpackHotDevClient'),
export default context => [
  // Some polyfills to apply by default
  require.resolve('../polyfills'),
  // Include an alternative client for WebpackDevServer. A client's job is to
  // connect to WebpackDevServer by a socket and get notified about changes.
  // When you save a file, the client will either apply hot updates (in case
  // of CSS changes), or refresh the page (in case of JS changes). When you
  // make a syntax error, this client will display a syntax error overlay.
  // Note: instead of the default WebpackDevServer client, we use a custom one
  // to bring better experience for Create React App users. You can replace
  // the line below with these two lines if you prefer the stock client:
  // require.resolve('webpack-dev-server/client') + '?/',
  // require.resolve('webpack/hot/dev-server'),
  require.resolve('react-dev-utils/webpackHotDevClient'),
  'webpack-dev-server/client?http://localhost:3000', // WebpackDevServer host and port
  'webpack/hot/only-dev-server',
  // we need the regenerator runtime for compatibility
  // with redux-saga and redux-saga-process
  'regenerator-runtime/runtime',
  context.files.main(),
];
