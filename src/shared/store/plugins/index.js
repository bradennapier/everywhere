/* @flow */
import config from 'utils/config';

import type { AppStateDescriptor } from 'main';

type PluginImportType = {
  default?: (app: AppStateDescriptor) => void,
  [exportName: string]: mixed
};

/* Retrieve and call default() on the plugins that should be activated */
const importAndRunConfiguredStorePlugins = async (app: AppStateDescriptor) => {
  await importConfiguredStorePlugins(app, true);

  return app;
};

/**
 * importConfiguredStorePlugins will run a dynamic import on each configured
 * store plugin that should be imported.  It can additionally be setup to
 * automatically call the default export of each as it iterates.
 * @param  {AppStateDescriptor}  app AppStateDescriptor
 * @param  {Boolean}             run Run default export function if available?
 * @return {Promise[]}
 */
const importConfiguredStorePlugins = async (app: AppStateDescriptor, run: boolean = false) => {
  const promises: Array<Promise<*>> = [];
  config('store.plugins', []).forEach((pluginID: string) => {
    const pluginInitializationPromise = import(/* webpackChunkName: "store-plugins" */ `./${pluginID}/${pluginID}`)
      .then((m: PluginImportType) => {
        if (run) {
          if (m && typeof m.default === 'function') {
            return m.default(app);
          } else if (process.env.NODE_ENV === 'development') {
            console.warn(`[WARNING] | Store Plugin ${pluginID} does not properly export an async handler function.`);
          }
        }
        return m;
      })
      .catch(error => console.error(`[ERROR] | Store Plugin ${pluginID} failed to import: `, error));
    promises.push(pluginInitializationPromise);
  });

  // After importing the configured store plugins, we need to wait for
  // them all to resolve and mutate our app state descriptor as needed.
  if (promises.length) {
    return Promise.all(promises);
  }

  // No need to resolve an additional Promise if none were added to the array.
  return promises;
};

export default importAndRunConfiguredStorePlugins;

export { importAndRunConfiguredStorePlugins, importConfiguredStorePlugins };
