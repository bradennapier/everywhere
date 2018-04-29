import { call } from 'redux-saga/effects';

import eventObserverSaga from 'saga-event-observer';

// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
// let hidden
let visibilityChange;

if (typeof document.hidden !== 'undefined') {
  // Opera 12.10 and Firefox 18 and later support
  // hidden = 'hidden';
  visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== 'undefined') {
  // hidden = 'msHidden';
  visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
  // hidden = 'webkitHidden';
  visibilityChange = 'webkitvisibilitychange';
}

export default function* startKeypressMonitor(config, handlers) {
  if (!config.monitor.visibility) {
    return;
  }
  yield call(
    [this.task, this.task.create],
    'monitors',
    'page-visibility',
    eventObserverSaga,
    'page-visibility',
    [visibilityChange],
    handlers,
  );
}
