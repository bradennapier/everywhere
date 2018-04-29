/* @flow */
import type { AppStateDescriptor } from 'types/app';

import config from 'utils/config';
import { createLogger } from 'redux-logger';

async function getStateTransformer() {
  // We only need to load the stateTransformer if the immutable
  // plugin is currently active.
  if (config('store.plugins', []).includes('immutable')) {
    return import('redux-seamless-immutable-static').then(m => m.stateTransformer);
  }
}

async function loadLoggerStorePlugin(app: AppStateDescriptor) {
  // Redux Logger should only run if we are currently in
  // development stage.
  if (app.config) {
    const { config: appConfig } = app;

    const loggerMiddleware = createLogger({
      stateTransformer: await getStateTransformer(),
      // Should logs start collapsed?
      collapsed: true,
      // Should logs include duration / perf?
      duration: true,
    });

    appConfig.middlewares.push(loggerMiddleware);
  }
}

export default loadLoggerStorePlugin;
