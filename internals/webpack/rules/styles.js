export default () => [
  /**
   * Style Loading is done in this configuration by matching the
   * filename to see if it should use css-modules loading (if uncommented).
   *
   * When ".local" is in the filename, css-modules will be utilized when
   * importing.
   */
  {
    test: /\.global\.css$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          importLoaders: 1,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
        },
      },
    ],
  },

  // css-modules boilerplate
  {
    test: /^((?!\.global).)*\.css$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          modules: true,
          sourceMap: true,
          camelCase: true,
          importLoaders: 1,
          localIdentName: '[name]__[local]__[hash:base64:5]',
        },
      },
      // postCSS support boilerplate
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
        },
      },
    ],
  },
  /**
   * SASS Loader Support
   */
  // {
  //   test: /^((?!\.local).)*\.scss$/,
  //   use: [
  //     { loader: 'style-loader' },
  //     {
  //       loader: 'css-loader',
  //       options: {
  //         sourceMap: true,
  //         importLoaders: 1,
  //       },
  //     },
  //     { loader: 'sass-loader' },
  //   ],
  // },
  // {
  //   test: /\.global\.scss$/,
  //   use: [
  //     { loader: 'style-loader' },
  //     {
  //       loader: 'css-loader',
  //       options: {
  //         modules: false,
  //         sourceMap: true,
  //         importLoaders: 1,
  //         localIdentName: '[name]__[local]__[hash:base64:5]',
  //       },
  //     },
  //     { loader: 'sass-loader' },
  //   ],
  // },
];
