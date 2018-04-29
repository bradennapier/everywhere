import { Process } from 'redux-saga-process';

import { call, put } from 'redux-saga/effects';

import { createTaskManager } from 'saga-task-manager';
import log from 'electron-log';
import requestUserGeo from 'sagas/user/requestUserGeo';

// import DatastreamChannel from 'cluster-comm';
//
// const channel = new DatastreamChannel();
//
// console.log('CHANNEL: ', channel);
//
// channel.subscribe('one', evt => {
//   console.log('Event!!! ', 'one', evt);
// });

const buildConfig = config => ({
  reduces: 'user',
  pid: 'events',
  exports: ['actions', 'selectors'],
  ...config,
  log: true,
  monitor: {
    keypress: true,
    errors: true,
    network: true,
    visibility: true,
    ...config.monitor,
  },
});

const processLoadsOnAction = 'AUTH_SUCCESS';

const processLoadsWithScope = (promises, defaulted) => {
  /* load our scope asynchronously once the user has logged in. */
  promises.merge({
    handleKeyPressEvent: import(/* webpackChunkName: "process-events-scope" */
      './sagas/handlers/handleKeyPress').then(defaulted),
    startKeyPressMonitor: import(/* webpackChunkName: "process-events-scope" */
      './sagas/observers/keypressObserver').then(defaulted),
    startErrorMonitor: import(/* webpackChunkName: "process-events-scope" */
      './sagas/observers/errorObserver').then(defaulted),
    // startSpeechRecognitionObserver: import(/* webpackChunkName: "process-events-scope" */
    // './sagas/observers/speechObserver').then(defaulted),
    startPageVisibilityMonitor: import(/* webpackChunkName: "process-events-scope" */
      './sagas/observers/pageVisibilityObserver').then(defaulted),
  });
};

const processReducer = {
  userGeo: (state, action) => ({
    ...state,
    location: {
      ...state.location,
      address: action.geo.location.formattedAddress,
    },
  }),
};

const processActionRoutes = {
  userLocation: 'handleUserLocation',
};

export default function configureGlobalEventsProcess(_config) {
  const config = buildConfig(_config);

  const processSelectors = {};

  const processConfig = {
    pid: config.pid,
    reduces: config.reduces,
  };

  // our PromiseMap resolves into an object in the instance (this.scope).
  // it will populate this object when the process starts
  let scope;

  class GlobalEventsProcess extends Process {
    constructor(processID, proc) {
      super(processID, proc);
      this.processID = processID;
      this.userGeoLastUpdated = 0;
    }

    * handleEvent(event, value, uid) {
      // console.log('Handle Event: ', event);
      switch (event) {
        case 'keyup':
        case 'keydown': {
          yield call([this, scope.handleKeyPressEvent], event, value, uid, {
            keypressSubscriptions: this.keypressSubscriptions,
          });
          break;
        }
        case 'error': {
          yield put({
            type: 'ERROR_UNCAUGHT',
            uid,
            error: value,
          });
          break;
        }
        case 'unhandledrejection': {
          yield put({
            type: 'ERROR_UNCAUGHT',
            uid,
            error: value,
          });
          break;
        }
        case 'webkitvisibilitychange':
        case 'msvisibilitychange':
        case 'visibilitychange': {
          let visible;
          if (typeof document.hidden !== 'undefined') {
            visible = !document.hidden;
          } else if (typeof document.msHidden !== 'undefined') {
            visible = !document.msHidden;
          } else {
            visible = !document.webkitHidden;
          }
          if (typeof visible !== 'undefined') {
            yield put({
              type: 'PAGE_VISIBILITY',
              visible,
            });
          }

          break;
        }
        default: {
          console.warn('[event-process]: Default Clause Reached in HandleEvent');
          break;
        }
      }
    }

    handleError(e) {
      log.error('[EVENTS/handleError]: An Error ocurred: ', e.message);
    }

    handleCancel() {
      console.warn('[events] Cancel!');
    }

    * handleUserLocation({ latitude, longitude }) {
      if (Date.now() - this.userGeoLastUpdated >= 30000) {
        yield call([this, requestUserGeo], latitude, longitude);
        this.userGeoLastUpdated = Date.now();
      }
    }

    * processStarts() {
      scope = this.scope;

      this.task = createTaskManager(this.processID, {
        name: 'EVENTS',
        log: config.log,
        icon: '🎟️',
      });

      this.eventHandlers = {
        onEvent: [this, this.handleEvent],
        onError: [this, this.handleError],
        onCancel: [this, this.handleCancel],
      };

      this.keypressSubscriptions = new Set([
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Backspace',
        'Delete',
        // alt + f
        'ƒ',
        // alt + m
        'µ',
        // alt + spacebar
        ' ',
        // alt + p
        'π',
        // alt + n
        'Dead',
        // alt + c
        'ç',
        ...(config.keypressSubscriptions || []),
      ]);

      yield call(
        [this, scope.startKeyPressMonitor],
        config,
        this.eventHandlers,
      );
      yield call([this, scope.startErrorMonitor], config, this.eventHandlers);
      yield call(
        [this, scope.startPageVisibilityMonitor],
        config,
        this.eventHandlers,
      );
    }
  }

  return {
    process: GlobalEventsProcess,
    config: processConfig,
    selectors: processSelectors,
    loadsOnAction: processLoadsOnAction,
    loadProcess: processLoadsWithScope,
    actionRoutes: processActionRoutes,
    reducer: processReducer,
  };
}
