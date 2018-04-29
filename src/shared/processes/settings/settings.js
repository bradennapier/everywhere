/* @flow */
import { Process } from 'redux-saga-process';
import { put, select } from 'redux-saga/effects';
import _ from 'lodash';

import processReducer from './config/processReducer';
import processSelectors from './config/processSelectors';
import { getInitialState } from './config/processInitialState';

const processInitialState = getInitialState();

const buildConfig = config => ({
  reduces: 'settings',
  pid: 'settings',
  ...config,
});

const processActionRoutes = {
  rehydrateComplete: 'handleRehydration',
};

const processActionCreators = {
  setSettings: [{ type: 'SETTINGS_SET_SETTINGS' }, 'path', 'value'],
  mergeSettings: [{ type: 'SETTINGS_MERGE_SETTINGS' }, 'settings', 'path'],
  '!updateSettings': [{ type: 'SETTINGS_REPLACE_SETTINGS' }, 'settings'],
};

/**
 * AppSettingsProcess
 *   Provides the overall application settings object used to allow setting
 *   of user-specific options for various widgets.
 *
 * @param  {[type]}   _config  [description]
 * @return {[type]}            [description]
 */
export default function configureAppSettingsProcess(_config: {}) {
  const config = buildConfig(_config);

  class AppSettingsProcess extends Process {
    * handleRehydration(): Generator<*, *, *> {
      // When we are finished rehydrating, we will do a merge
      // of our initial state with the rehydrated state so any
      // new values are present.
      const currentSettings = yield select(processSelectors.settings);
      const newSettings = _.defaultsDeep(
        {},
        currentSettings,
        processInitialState,
      );
      if (!_.isEqual(newSettings, currentSettings)) {
        yield put(this.actions.updateSettings(newSettings));
      }
    }
  }

  return {
    config,
    process: AppSettingsProcess,
    actionCreators: processActionCreators,
    actionRoutes: processActionRoutes,
    reducer: processReducer,
    selectors: processSelectors,
    initialState: processInitialState,
  };
}
