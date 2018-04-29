import { call, fork } from 'redux-saga/effects';
import SagaObservable from 'saga-observable';

// Use the history object to monitor route changes
export default function* appRouteObserver(history, handlers) {
  const observer = new SagaObservable({ name: 'route-change-observer' });
  const unlisten = history.listen(observer.publish);
  try {
    while (true) {
      const data = yield call([observer, observer.next]);
      yield fork(handlers.onEvent, ...data);
    }
  } catch (e) {
    if (handlers.onError) {
      yield call(handlers.onError, e);
    } else {
      console.error(`Route Observer: ${e.message}`);
    }
  } finally {
    if (yield observer.cancelled()) {
      if (handlers.onCancel) {
        yield call(handlers.onCancel);
      }
    }
    unlisten();
  }
}
