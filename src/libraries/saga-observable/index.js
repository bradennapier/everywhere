/* @flow */
import PromiseQueue from 'promise-queue-observable';

import { CANCEL } from 'redux-saga';

export default class SagaObservable {
  constructor(config = {}) {
    this.observable = new PromiseQueue({
      ...config,
      promiseFactory: promise => {
        if (config.promiseFactory) {
          promise = config.promiseFactory(promise);
        }
        promise[CANCEL] = () => {
          if (this.observable) {
            this.observable.cancel();
          }
        };
        return promise;
      },
    });
  }
  next = () => this.observable && this.observable.next();
  publish = (...args) => this.observable && this.observable.publish(...args);
  cancel = () => this.observable && this.observable.cancel();
  cancelled = () => this.observable && this.observable.cancelled();
}
