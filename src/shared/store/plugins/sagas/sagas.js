/* @flow */
import createSagaMiddleware from 'redux-saga';
import sagas from 'sagas';
import defaulted from 'utils/defaulted';

import type { App$StateDescriptor } from 'types/app';
import type { Store$PluginMetaData } from 'types/store';

import log from 'utils/log';

/**
 * Plugin Metadata
 */
// eslint-disable-next-line
export const meta: Store$PluginMetaData = {
  id: 'sagas',
};

let sagaMiddleware;

async function loadSagaStorePlugin(app: App$StateDescriptor) {
  const { config: appConfig } = app;
  if (appConfig) {
    // Create the Middleware
    sagaMiddleware = createSagaMiddleware();
    // Add the Saga Middelware
    appConfig.middlewares.push(sagaMiddleware);
    // Once Store is created, run the sagas and save the sagaTask
    // to our app state descriptor.
    appConfig.hooks.afterCreate.set(meta.id, () => {
      app.sagaTask = sagaMiddleware.run(sagas);
    });
  }
}

async function reload(app: App$StateDescriptor) {
  const { config: appConfig } = app;
  if (appConfig) {
    if (!sagaMiddleware) {
      sagaMiddleware = createSagaMiddleware();
    }

    const newSagas = await import('../../../sagas').then(defaulted);

    log('[HOT RELOAD] | Sagas', newSagas);

    // Replace the afterCreate hook so that it runs our new sagas rather
    // than the previous.
    appConfig.hooks.afterCreate.set(meta.id, () => {
      app.sagaTask = sagaMiddleware.run(newSagas);
    });
  }
}

export default loadSagaStorePlugin;

export { reload };
