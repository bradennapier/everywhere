/* @flow */
import log from 'utils/log';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';

import executeHooks from 'utils/executeHooks';
// import defaulted from 'utils/defaulted';

import type { App$StateDescriptor, App$InitialState } from 'types/app';
import type { Store$SetupConfig } from 'types/store';

/* Redux Middleware & Enhancers */
import buildAsyncReducers from './reducers';

import { importAndRunConfiguredStorePlugins, importConfiguredStorePlugins } from './plugins';

/**
 * This is a workaround to stop webpack from breaking our build
 * when using process.env.NODE_ENV in production.
 */
const IS_FALSE = false;

const buildAppDescriptorConfig = (initialState = {}): Store$SetupConfig =>
  /* Configuration of Setup Variables, Removed after Creation */
  ({
    /* The compose function used to compose the redux enhancers */
    // @NOTE: Replaced when adding redux devtools.
    compose,

    /* The combineReducers call that should be used */
    combineReducers,

    /* Holds the initialState which will be used */
    initialState,

    /* Will hold the reducer once created */
    reducer: undefined,

    /* An array of middlewares to add */
    middlewares: [],

    enhancers: [],

    /**
     * app.hooks allows various functions to hook into
     * the state creation lifecycle.  It is used primarily
     * to make it easier to provide all the logic necessary
     * for a given feature / middleware in one function/place.
     *
     * Each hook is an array that can contain any number of hooks
     * for the given lifecycle.  Generally they will be used to
     * modify / mutate the app object to change the behavior of the
     * the state.
     */
    hooks: {
      /* Do something when store is created */
      afterCreate: new Map(),
      /* Do something before store is create */
      beforeCreate: new Map(),
      /* When the reducer has been combined and prepared */
      onReducer: new Map(),
    },

    reducers: {},
  });

/**
 * Asynchronously start the store, returning a promise that
 * resolves to a descriptor of the store.
 * @param  {Object} [initialState={}]     Initial State for the store
 * @return {Promise<App$StateDescriptor>}  Promise resolved to store descriptor
 *
 * @NOTE: This is the default exported function.
 *
 * @NOTE: This is generally accomplished by passing the "App Store Descriptor"
 *        throughout the build process.  Each piece will mutate the descriptor
 *        so provide us with a final configuration that can be used.
 *
 *        Care should be used when mutating as we can never be sure when a given
 *        plugin will be setup over another.
 *
 *        -- Adding New Plugins --
 *        Adding new plugins is accomplished by adding them into the ./plugins
 *        folder.  A js file with the same name as the folder will be imported
 *        and executed (asynchronously) if the plugin is listed in the config
 *        file under "store.plugins" array.
 *
 *        Some plugins will check to see if another plugin is present and may
 *        add extra functionality that should only be present if all the required
 *        plugins are met.
 *
 *        For example, if "immutable" and "persist" are added, then a transformer
 *        for the persist plugin will be added to convert the immutable structure
 *        before saving to local storage.
 *
 */
async function configureAsyncStore(
  app: App$StateDescriptor,
  initialState?: App$InitialState,
): Promise<App$StateDescriptor> {
  const appConfig = buildAppDescriptorConfig(initialState);

  app.config = appConfig;

  // Import and Setup any Plugins - they will mutate the app object as-needed
  // to allow themselves to setup using the hooks system.
  await importAndRunConfiguredStorePlugins(app);

  /* Compose Middlewares into the Enhancers, Executing onEnhancers hook */
  await buildAsyncReducers(app);

  await handleCompileReducer(app);

  /* Create our Redux Store Enhancers using the descriptors compose function */
  const enhancers = appConfig.compose(applyMiddleware(...appConfig.middlewares));

  // @NOTE: Execute beforeCreate Hook
  await executeHooks(appConfig.hooks.beforeCreate, app);

  if (typeof appConfig.reducer === 'function') {
    const store = createStore(
      /* Combine the Reducers using the provided combineReducers Function */
      appConfig.reducer,
      appConfig.initialState,
      enhancers,
    );

    app.store = store;

    // @NOTE: Execute afterCreate Hook
    await executeHooks(appConfig.hooks.afterCreate, app);

    if (process.env.NODE_ENV !== 'development') {
      /* Remove the config from our store if production */
      app.config = undefined;
    }

    /* Dispatch our final STORE_READY action */
    store.dispatch({
      type: 'STORE_READY',
      app,
    });
  } else {
    log(
      {
        level: 'error',
        log: 'The Application Reducer was not created properly',
      },
      app,
    );
  }

  handleDevelopmentEnvironmentIfNeeded(app);

  return app;
}

async function handleCompileReducer(app: App$StateDescriptor) {
  const { config: appConfig } = app;
  if (appConfig) {
    // Execute onReducer Hook
    await executeHooks(appConfig.hooks.onReducer, app);

    // Create our Initial Reducer Function (CombineReducers)
    appConfig.reducer = appConfig.combineReducers(appConfig.reducers);
  }
}

function handleDevelopmentEnvironmentIfNeeded(app: App$StateDescriptor) {
  /*
    Handle Hot Reloading of Reducers -
    Modifying Reducers will also reload all sagas / processes.

    Note: During this process any store plugins which export a function
    "reload" will be called to process however required.
   */
  if ((module.hot && module.hot.accept) || IS_FALSE) {
    module.hot.accept('./reducers', () => {
      console.log('Hot Reload Reducers!');
      const { sagaTask } = app;
      if (sagaTask) sagaTask.cancel();

      /* Reset the App Configuration as we rebuild */
      prepareAppConfigForHotReload(app);

      /* Wait for our Sagas to Complete their Cancellation Process */
      return Promise.resolve(sagaTask && sagaTask.done).then(() =>
        Promise.all([
          importConfiguredStorePlugins(app),
          /*
            We import and call the buildAsyncReducers function which mutates
            our AppStateDescriptor with a new 'reducers' value in the config.
           */
          import('./reducers').then(newBuildAsyncReducers => newBuildAsyncReducers.default(app)),
        ]).then(([plugins]) => hotReloadReducersAndPlugins(app, plugins)));
    });

    module.hot.accept('../sagas', () => {});

    module.hot.accept();
  }
}

function prepareAppConfigForHotReload(app: App$StateDescriptor) {
  const { config: appConfig } = app;
  if (appConfig) {
    appConfig.reducer = undefined;
    appConfig.reducers = {};
  }
}

async function hotReloadReducersAndPlugins(app: App$StateDescriptor, plugins: Array<*>) {
  const { store, config: appConfig } = app;
  if (store && appConfig) {
    await handleCompileReducer(app);

    // @NOTE: Execute afterCreate Hook since we do not change
    //        the store (create a new one).
    await executeHooks(appConfig.hooks.afterCreate, app);

    if (plugins.length) {
      /*
        If any plugins export a 'reload' function, we will call the function
        and feed it our AppStateDescriptor and the array of all plugins currently
        imported (an object of all their exports).
       */
      plugins
        .filter(plugin => plugin && typeof plugin.reload === 'function')
        .forEach(plugin => plugin.reload(app, plugins));
    }

    // Replace the reducer with our updated reducer
    store.replaceReducer(appConfig.reducer);
  }
}

export default configureAsyncStore;
export { configureAsyncStore };
