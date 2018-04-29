/* @flow */
import type { App$StateDescriptor } from 'types/app';

import defaulted from 'utils/defaulted';

// import { routerReducer } from 'redux-seamless-immutable-static';

import { buildAsyncProcesses } from 'redux-saga-process';

type ProcessConfiguration = {
  log: boolean
};

const commonProcessConfiguration: ProcessConfiguration = {
  log: false,
};

/**
 * handleConfigureProcess
 * @param  {Function} processFactory [description]
 * @param  {String}   processID      [description]
 * @param  {String}   processPath    [description]
 * @return {Process}                 [description]
 *
 * if we encounter a function that is not a process, this is called to allow
 * us to build the process.  If we return a valid process then it will be
 * built and added
 *
 * This is called during the build process by redux-saga-process.  This allows
 * per-process configuration of settings.
 */
function handleConfigureProcess(processFactory /* processID */ /* processPath */) {
  return processFactory({
    /* Process Specific Configuration */
    ...commonProcessConfiguration,
  });
}

/*
  Uses code-splitting to dynamically load the processes and their dependencies.
  All of the processes are included within the "app-processes" chunk that is generated
  and loaded asynchronously while the application bootstrap continues.

  To add new processes, simply make sure they include the magic comment found in
  the import() command before the string path to the process in question.
 */
const getAppProcesses = () => ({
  routerProcess: import(/* webpackChunkName: "app-processes" */ 'processes/router/router'),
  // settingsProcess: import(/* webpackChunkName: "app-processes" */ 'processes/settings/settings').then(defaulted),
  // websocketProcess: import(/* webpackChunkName: "app-processes" */ 'processes/websocket/websocket').then(defaulted),
});

async function handleBuildAsyncReducers(app: App$StateDescriptor) {
  if (app.config) {
    const { reducers } = app.config;

    const processesToRender = getAppProcesses();

    /**
     * buildProcesses (redux-saga-process)
     * @returns {CompiledProcessReducers}
     */
    const { processReducers } = await buildAsyncProcesses(
      processesToRender,
      {
        /* Process Package Configuration Options */
        log: false,
      },
      handleConfigureProcess,
    );

    Object.assign(reducers, processReducers);
  }

  return app;
}

export default handleBuildAsyncReducers;
