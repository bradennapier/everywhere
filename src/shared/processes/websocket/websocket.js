/* @flow */

import Immutable from 'seamless-immutable';
import WebSocket from 'ws';
import uuid from 'shortid';
import { Process } from 'redux-saga-process';
import { put, call } from 'redux-saga/effects';
import { delay } from 'redux-saga';

import { createTaskManager } from 'saga-task-manager';

import tryJSON from 'utils/tryJSON';

import handleObserveEvents from './sagas/observeEvents';

const buildConfig = (config: {} = {}) => ({
  reduces: 'ws',
  pid: 'ws',
  ...config,
  log: true,
});

const processActionRoutes = {
  wsConnect: 'handleConnect',
  wsSend: 'handleSend',
  wsDisconnect: 'handleDisconnect',
};

const processActionCreators = {
  /* Private Actions (In-Process Only) */
  '!wsDisconnected': ['schema'],
  '!wsConnecting': ['schema'],
  /* Public Actions  (In-Process & Component Connections) */
};

const processInitialState = {
  schema: {},
  status: {
    isConnecting: false,
    isConnected: false,
  },
};

const processReducer = {
  SYSTEM_CONNECTING: (state, action) => {
    if (state.schema.host && action.schema.host === state.schema.host) {
      // if we were already connected to this host and are simply
      // reconnecting, then we merge the new status and schema in
      // while allowing the rest of our state to remain available.
      return Immutable.merge(state, {
        schema: action.schema,
        status: {
          isConnecting: true,
          isConnected: false,
        },
      });
    }
    // otherwise we return a replaced state so that we do not
    // have data from another system mixed in with our state on
    // accident.
    return Immutable.replace(
      state,
      {
        schema: action.schema,
        status: {
          isConnecting: true,
          isConnected: false,
        },
      },
      { deep: true },
    );
  },
  SYSTEM_DISCONNECTED: state =>
    // When we disconnect, we only do a simple merge of our
    // status, leaving the schema and other data that we may
    // have acquired alone.
    Immutable.merge(state, {
      status: {
        isConnecting: false,
        isConnected: false,
      },
    }),
  SYSTEM_RECEIVE: (state, action) =>
    Immutable.merge(
      state,
      {
        ...action.payload,
        status: {
          isConnected: true,
          isConnecting: false,
        },
      },
      { deep: true },
    ),
};

type WebSocketSchema = {|
  host: void | string,
  port: void | number,
  protocol: 'ws' | 'wss',
  reconnect: boolean
|};

type ProcessState = {|
  reconnect: boolean,
  isConnected: boolean,
  socket: void | WebSocket
|};

export default function configureDashSystemLocalProcess(_config?: {}) {
  const config = buildConfig(_config);

  const processConfig = {
    pid: config.pid,
    reduces: config.reduces,
    log: config.log,
  };

  class DashSystemLocalProcess extends Process {
    /* Redux-Saga-Process will set this on creation */
    processID: string;

    schema: WebSocketSchema = {
      host: undefined,
      port: 9001,
      protocol: 'ws',
      reconnect: true,
    };

    state: ProcessState = {
      socket: undefined,
      reconnect: false,
      isConnected: false,
    };

    * handleConnect(schema: WebSocketSchema = this.schema): Generator<*, *, *> {
      try {
        this.state.reconnect = true;

        if (schema !== this.schema) {
          this.schema = {
            host: schema.host,
            port: schema.port,
            protocol: schema.protocol || 'ws',
            reconnect: schema.reconnect || true,
          };
        }

        const { protocol, host, port } = this.schema;

        if (!host || !port) {
          console.error('[ERROR]: Host or Port Not Provided to WebSocket: ', this.schema);
          return;
        }

        const addr = `${protocol}://${host}:${port}`;

        if (this.state.socket) {
          yield call([this, this.handleDisconnect]);
        }

        this.state.socket = new WebSocket(addr);

        /**
         * Registers our WebSocket Event Handlers so that any events are
         * looped through and in turn will execute our handleEvent().
         *  Reference: ./sagas/observerEvents
         */
        yield call([this.task, this.task.create], 'ws', addr, [this, handleObserveEvents], this.state.socket, [
          'open',
          'close',
          'error',
          'message',
        ]);
      } catch (error) {
        console.warn('WebSocket Connection Error! ', error);
      }
    }

    handleDisconnect({ reconnect } = {}) {
      if (reconnect !== undefined) {
        this.state.reconnect = reconnect;
      }
      if (this.WS) {
        this.WS.close();
      }
    }

    * handleSend({ type, ...payload }): Generator<*, *, *> {
      console.log('Sending Payload to System: ', payload);
      const { host } = payload;
      if (host && this.schema.host !== host) {
        console.warn('Given host does not match connected system');
        return;
      }
      payload.host = undefined;
      if (!payload.uuid) {
        payload.uuid = uuid.generate();
      }
      yield put({
        type: `SYSTEM_SEND_${payload.uuid.toUpperCase()}`,
      });
      const stringified = tryJSON.stringify(payload);
      this.WS.send(stringified);
    }

    * handleEvent(event, ...args): Generator<*, *, *> {
      const [received, ...rest] = args;

      switch (event) {
        case 'open': {
          console.info('[System Communicator] | OPEN | ');
          yield put(this.actions.systemConnecting(this.schema));
          break;
        }
        case 'close': {
          console.info('[System Communicator] | CLOSE | ');
          yield put(this.actions.systemDisconnected(this.schema));
          break;
        }
        case 'error': {
          console.error('[System Communicator] | ERROR | ', received.message);
          break;
        }
        case 'message': {
          const data = tryJSON.parse(received.data);
          if (!data) {
            return;
          }
          console.info('[SYSTEM COMMUNICATOR] | MESSAGE | ', data);
          yield call([this, this.handleReceivedData], data);
          break;
        }
        default: {
          console.warn('System Communicator Default Clause Reached: ', event);
          break;
        }
      }
    }

    * handleReceivedData(payload): Generator<*, *, *> {
      const { uuid, result, ...data } = payload;
      console.log('Handling Received: ', uuid, result, data);
      switch (uuid) {
        case 'system_restart': {
          if (result === 'ok') {
            yield call(delay, 5000);
            yield call([this, this.handleDisconnect]);
          }
          break;
        }
        default: {
          return yield put({
            type: 'SYSTEM_RECEIVE',
            payload: {
              [uuid]: data,
            },
          });
        }
      }
    }

    /**
     * When the Process is created, the function below will be called
     * to initiate the Process's functionality if required.
     */
    processStarts() {
      console.log('WEBSOCKET PROCESS STARTS ! ', this);
      this.task = createTaskManager(this.processID, {
        name: 'WEBSOCKET',
        log: processConfig.log,
        icon: '🎟️',
      });
    }
  }

  return {
    process: DashSystemLocalProcess,
    config: processConfig,
    initialState: processInitialState,
    actionRoutes: processActionRoutes,
    actionCreators: processActionCreators,
    reducer: processReducer,
  };
}
