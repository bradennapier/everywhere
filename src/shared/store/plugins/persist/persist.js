/* @flow */

import config from 'utils/config';

import type { App$StateDescriptor } from 'types/app';
import type { $PluginMetaData } from 'types/store';

/**
 * Plugin Metadata
 */
// eslint-disable-next-line
export const meta: $PluginMetaData = {
  id: 'sagas',
};

let engine;

// @TODO: This ends up creating two chunks, one of which is very small.
//        It would be best to find the best way to make it a single chunk.
//
//        In order to do that, we will need to tie this chunk to the main
//        chunk.
async function loadPersistenceStorePlugin(app: App$StateDescriptor) {
  engine = config(['store', 'persist', 'engine']);
  switch (engine) {
    case 'redux-persist': {
      return import('./engines/reduxPersist').then(m => m.default(app));
    }
    default: {
      console.error('[ERROR] | Unknown Persist Engine: ', engine);
    }
  }
}

/**
 * Allow for Hot Reloading of our Persist Plugin.
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
async function reload(app: App$StateDescriptor) {}

export default loadPersistenceStorePlugin;

export { reload };
