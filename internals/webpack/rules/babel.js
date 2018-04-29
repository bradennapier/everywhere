export default context => [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    // exclude: /(?:node_modules)(?!\/ethereumjs-util)/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          cacheDirectory: true,
          presets: [
            '@babel/preset-flow',
            [
              '@babel/preset-env',
              {
                modules: false,
                useBuiltIns: 'usage',
                shippedProposals: true,
                targets: {
                  browsers: ['last 2 versions'],
                },
              },
            ],
            '@babel/preset-stage-0',
            '@babel/preset-react',
          ],
          plugins: [
            'lodash',
            'react-native-web',
            // 'transform-react-jsx-source',
            // 'transform-react-jsx-self',
            // 'transform-class-properties',
            // 'react-hot-loader/babel',
          ],
        },
      },
    ],
  },
];
