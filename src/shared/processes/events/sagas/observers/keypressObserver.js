import { all, call } from 'redux-saga/effects';

import eventObserverSaga from 'saga-event-observer';

export default function* startKeypressMonitor(config, handlers) {
  if (!config.monitor.keypress) {
    return;
  }
  yield all([
    call(
      [this.task, this.task.create],
      'monitors',
      'keypress',
      eventObserverSaga,
      'events-keypress-observer',
      ['keydown'],
      handlers,
    ),
    call(
      [this.task, this.task.create],
      'monitors',
      'keyup',
      eventObserverSaga,
      'events-keyup-observer',
      ['keyup'],
      handlers,
    ),
  ]);
}
