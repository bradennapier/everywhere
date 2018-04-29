/* @flow */
import config from 'utils/config';

import type { AppStateDescriptor } from 'types/app';

import { meta } from '../persist';

/**
 * If redux-persist is set as the persist engine then the necessary
 * modules will be imported and configured.
 * https://github.com/rt2zz/redux-persist
 *
 * We utilize localforage as the storage engine which allows us to
 * utilize any number of storage schemes.
 *
 * https://github.com/localForage/localForage
 */
async function loadReduxPersist(app: AppStateDescriptor) {
  if (app.config) {
    const { config: appConfig } = app;

    await Promise.all([
      import('redux-persist'),
      import('localforage'),
      config('store.plugins', []).includes('immutable') && import('../transformer/immutableTransformer'),
    ]).then(([{ persistStore, persistReducer }, { default: localForage }, persistTransformer]) => {
      // Setup localforage configuration based on config values.
      localForage.config({
        name: config('app.name'),
        version: config('app.version'),
        storeName: config('store.persist.name'),
        description: config('store.persist.description'),
      });

      // When the reducer has been created, we need to replace it with
      // our persistReducer as specified.
      appConfig.hooks.beforeCreate.set(meta.id, async () => {
        const persistConfig = {
          key: 'idex',
          storage: localForage,
          whitelist: config('store.persist.keys'),
          debug: false,
          // migrate: (state, n) => new Promise()
          transforms: [persistTransformer && persistTransformer.default],
          // throttle: 0,
        };
        if (appConfig.reducer) {
          appConfig.reducer = persistReducer(
            persistConfig,
            // We replace the current reducer with a new reducer that reduces
            // the current reducer (but with persistance added to it).
            appConfig.reducer,
          );
        }
      });

      // Once our store is created, we will create our store persistor
      // and dispatch a REHYDRATE_COMPLETE event when the state has
      // been rehydrated from the local storage.
      appConfig.hooks.afterCreate.set(meta.id, async () => {
        // @TODO: This is not yet completed
        if (app.store) {
          const persistor = persistStore(app.store, null, () =>
            app.store.dispatch({
              type: 'REHYDRATE_COMPLETE',
              app,
              persistor,
            }));
        }
      });
    });
  }
}

export default loadReduxPersist;
