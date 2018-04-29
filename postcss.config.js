/* eslint import/no-absolute-path: 0, global-require: 0, flowtype-errors/show-errors: 0 */

// require('@babel/register');

// const { flattenVars } = require('./libraries/redux-css-dev/redux-css-dev');

// const defaultTheme = require('./app/shared/themes/default').default;

// const variables = flattenVars({ theme: defaultTheme });

module.exports = {
  plugins: [
    require('postcss-import')({ addModulesDirectories: ['shared', 'shared/styles'] }),
    // require('postcss-simple-vars'),
    require('postcss-flexbugs-fixes'),
    require('postcss-cssnext')({
      browsers: ['last 2 versions', '> 5%'],
      features: {
        customProperties: { strict: false, preserve: true },
        customMedia: {
          extensions: {
            '--xl': '(width >= 1500px)',
            '--lg': '(width >= 1000px)',
            '--md': '(width <= 750px)',
            '--gtmd': '(width >= 750px)',
            '--sm': '(width <= 700px)',
            '--gtsm': '(width >= 700px)',
            '--xs': '(width <= 550px)',
            '--gtxs': '(width >= 1000px)',
            '--xxs': '(width <= 500px)',
            '--thin': '(height <= 575px)',
            '--portrait': '(orientation: portrait)',
            '--mobilelandscape': `only screen
              and (max-device-width: 700px)
              and (-webkit-min-device-pixel-ration: 2)
              and (orientation: landscape)
            `,
          },
        },
      },
    }),
    // require('postcss-simple-vars'),
    require('postcss-inline-media'),
  ],
};
