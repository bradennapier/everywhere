/* @flow */
import SetQueue from 'set-queue';

type SagaObservableConfig = {
  log: boolean,

  Promise: Class<Promise>,
  onCancel: void | Function,
  onDone: void | Function,

  queueStyle: 'next' | 'shift',

  promiseFactory: <+A>(promise: Promise<A>) => Promise<A>,
};

const buildConfig = (config?: {} = {}): SagaObservableConfig => ({
  log: false,

  Promise,
  onCancel: undefined,
  onDone: undefined,
  // next = always return the same promise until next is available
  // shift = shift the promise on each next(), returning in the called order
  queueStyle: 'next',
  // any time a new promise is created - if factory is given the promise is
  // sent to the factory with 'pull' or 'push' and the promise instance.
  promiseFactory: promise => {
    promise.done = function PromiseQueueDoneHandler(onDone) {
      this.onDone = onDone;
      return this;
    };

    promise.complete = function PromiseQueueCompleteHandler(result) {
      if (this.onDone) {
        this.onDone(result);
      } else {
        this.resolve(result);
      }
    };

    promise.done.bind(promise);
    promise.complete.bind(promise);

    return promise;
  },

  ...config,
});

const buildQueues = () => ({
  actions: new SetQueue(),
  dispatch: new SetQueue(),
});

const handleGetNextPromise = function handlingNextPromise() {
  let promise;
  if (this.isCancelled === true) return;
  if (this.promises.current) {
    promise = this.promises.current;
  } else {
    promise = new this.config.Promise((resolve, reject) =>
      this.queues.dispatch.add({ resolve, reject }));
    if (this.config.promiseFactory) {
      promise = this.config.promiseFactory(promise);
    }
    if (this.config.queueStyle === 'next') {
      promise = promise
        .then(r => {
          delete this.promises.current;
          return r;
        })
        .catch(e => {
          delete this.promises.current;
          throw e;
        });
      this.promises.current = promise;
    }
  }
  return promise;
};

export default class SagaObservable {
  config: SagaObservableConfig;

  isCancelled: boolean = false;

  isDone: boolean = false;

  promises = {
    current: undefined,
  };

  queues = buildQueues();

  constructor(config, handler) {
    this.config = buildConfig(config);

    if (typeof handler === 'function') {
      handler(this.publish, this.throw, this.done);
    }
  }

  publish = (...args) => {
    if (this.isCancelled === true || !this.queues) {
      return;
    }
    if (this.queues.dispatch.size) {
      return this.queues.dispatch.next().resolve(args);
    }
    const promise = new this.config.Promise(resolve => resolve(args));
    this.queues.actions.add(promise);
  };

  // throw a rejection to the next promise rather than a resolution
  throw = reason => {
    if (this.isCancelled === true || !this.queues) {
      return;
    }
    if (this.queues.dispatch.size) {
      this.queues.dispatch.next().reject(reason);
    } else {
      const promise = new this.config.Promise((resolve, reject) =>
        reject(reason));
      this.queues.actions.add(promise);
    }
    return this;
  };

  next = () => {
    if (this.isCancelled === true || !this.queues) {
      return;
    }
    if (this.queues.actions.size > 0) {
      return this.config.promise.resolve(this.queues.actions.next());
    }
    return handleGetNextPromise.call(this);
  };

  done = result => {
    if (this.isCancelled || this.isDone) {
      return;
    }
    this.isDone = true;
    try {
      if (typeof this.config.onDone === 'function') {
        this.config.onDone.call(this);
      }
      if (this.queues.dispatch.size > 0) {
        for (const consumer of this.queues.dispatch) {
          if (consumer.complete) {
            // promise has a done
            consumer.complete(result);
          } else {
            console.log('Promise Does Not Handle Done');
            consumer.reject(['cancel', result]);
          }
        }
      }
    } catch (e) {
      console.error(e.message);
    } finally {
      this.next = () => {
        throw new Error(`[SagaObservable]: ${this.name} next called after Completion`);
      };
      this.publish = (...args) => {
        this.config.log &&
          console.warn(
            '[SagaObservable]: Publish Received after Completion ',
            this.name,
            args,
          );
      };
    }
    return this.finished();
  };

  cancel = () => {
    if (this.isCancelled || this.isDone) {
      return;
    }
    this.isCancelled = true;
    this.isDone = true;
    try {
      if (typeof this.config.onCancel === 'function') {
        this.config.onCancel.call(this);
      }
      if (this.queues.dispatch.size > 0) {
        for (const consumer of this.queues.dispatch) {
          consumer.reject('cancel');
        }
      }
    } catch (e) {
      console.error(e.message);
    } finally {
      delete this.queues;
      delete this.promises.current;
      this.next = () => {
        throw new Error(`[SagaObservable]: ${this.name} next called after Cancellation`);
      };
      this.publish = (...args) => {
        this.config.log &&
          console.warn(
            '[SagaObservable]: Publish Received after Cancellation ',
            this.name,
            args,
          );
      };
    }
    return this.cancelled();
  };

  cancelled = () => this.isCancelled;
  finished = () => this.isDone;
}
