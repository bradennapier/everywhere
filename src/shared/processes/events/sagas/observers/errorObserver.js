import { call } from 'redux-saga/effects';

import eventObserverSaga from 'saga-event-observer';

export default function* startKeypressMonitor(config, handlers) {
  if (!config.monitor.errors) {
    return;
  }
  yield call(
    [this.task, this.task.create],
    'monitors',
    'errors',
    eventObserverSaga,
    'errors-observer',
    ['error'],
    handlers,
  );
  yield call(
    [this.task, this.task.create],
    'monitors',
    'unhandledrejection',
    eventObserverSaga,
    'promise-rejection-observer',
    ['unhandledrejection'],
    handlers,
  );
}
