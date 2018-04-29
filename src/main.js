/* @flow */
import log from 'utils/log';

import type { App$StateDescriptor, App$InitialState } from 'types/app';

import setupApplication from './index';
import setupStore from './store';

log('Starting Application!');

/**
 * Redux Initial State
 *  The initial state of the application.  Likely an empty object.
 */
const initialState: App$InitialState = {};

/**
 * App State Descriptor
 *  Used to hold and control the configuration of the applications
 *  state.  It is exported and also provides a means if necessary
 *  (should never be done unless needed) of accessing the store
 *  object directly.
 */
const app: App$StateDescriptor = {
  /* Will hold the store once created */
  store: undefined,

  /* Holds the root Redux-Saga Task */
  sagaTask: undefined,

  /* Populated with buildAppDescriptorConfig() when built */
  config: undefined,
};

/**
 * Application Initiation
 *  @TODO: Provide an overall description of this process once it has
 *         been completed.
 */
setupStore(app, initialState)
  .then(setupApplication)
  .catch(error => console.error('[ERROR]: While Setting up the Application: ', error));

if (module && module.hot != null) {
  module.hot.accept();
}
