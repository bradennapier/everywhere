/* @flow */
import { call } from 'redux-saga/effects';
import SagaObservable from 'saga-observable';

function* handleObserveEvents(
  ws: WebSocket,
  events: Array<'open' | 'close' | 'error' | 'message'>,
): Generator<*, *, *> {
  const observer = new SagaObservable({
    name: 'ws-observer',
  });
  for (const event of events) {
    ws.addEventListener(event, (...args) => observer.publish(event, ...args));
  }
  try {
    while (true) {
      const data = yield call([observer, observer.next]);
      yield call([this, this.handleEvent], ...data);
    }
  } catch (error) {
    console.warn('Catch Called in Observer [WebSocket]', error);
  } finally {
    if (yield observer.cancelled()) {
      console.warn('WebSocket Observer Cancelled');
    }
    yield call([this, this.disconnect]);
  }
}

export default handleObserveEvents;
