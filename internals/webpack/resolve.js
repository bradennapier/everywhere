/* @flow */

import path from 'path';
import { factory as componentResolver } from 'component-webpack-resolver-plugin';

import type { $Context } from '../utils';

export default (context: $Context) => ({
  extensions: ['.js', '.json'],
  plugins: [
    /**
     * Allows us to import a folder and have it look for the matching filename.
     * @example
     * import Component from 'shared/components/MyComponent'
     *  - Would find shared/components/MyComponent/MyComponent.js
     *  - Would look for index.js if this is not found
     */
    componentResolver('existing-directory', 'undescribed-raw-file'),
  ],
  modules: [
    /**
     * Resolve imports throughout the application in this order.
     * This allows us to import various parts of the application
     * easier for better organization.
     *
     * Modules always resolve top-down.
     */
    context.dirs.ui(),
    path.join(context.dirs.ui(), 'libraries'),
    'shared',
    'node_modules',
  ],
  alias: {
    vendor: path.resolve(context.dirs.ui(), 'vendor'),
    inherits$: path.resolve(context.dirs.root(), 'node_modules/inherits/inherits_browser'),
    util$: path.resolve(context.dirs.root(), 'node_modules/util'),
    // Support React Native Web
    // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
    'react-native': 'react-native-web',
  },
});
