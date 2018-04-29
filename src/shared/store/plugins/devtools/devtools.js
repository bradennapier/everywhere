/* @flow */
import type { AppStateDescriptor } from 'types/app';
import type { $PluginMetaData } from 'types/store';

import config from 'utils/config';

import { composeWithDevTools } from 'redux-devtools-extension';

/**
 * Plugin Metadata
 */
// eslint-disable-next-line
export const meta: $PluginMetaData = {
  id: 'devtools',
};

async function loadDevToolsStorePlugin(app: AppStateDescriptor) {
  app.config.compose = composeWithDevTools({
    name: config('app.name'),
  });
}

export default loadDevToolsStorePlugin;
