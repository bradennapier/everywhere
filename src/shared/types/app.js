/* @flow */
import type { Task as SagaTask } from 'redux-saga';
import type { Store$SetupConfig } from './store';

// export type SagaTask = {
//   cancel(): void,
//   done?: void | Promise<*>,
// };

export type App$StateDescriptor = {|
  store: void | Object,
  sagaTask: SagaTask | void,
  config: void | Store$SetupConfig,
  // ws: void | IDEXWebSocketClient,
|};

export type App$InitialState = { [key: string]: any };
