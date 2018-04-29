/* @flow */

import { call, cancelled } from 'redux-saga/effects';

export default function* onKillWatcher(): Generator<*, *, *> {
  try {
    if (this.config.log === 'debug') {
      this.handleLog('info', 'Starting Kill Watcher');
    }
    yield call((() => this.awaitHandler('onKilled'): any));
    this.handleLog('warn', 'TASK MANAGER KILLED');
    yield call([this, this.cancelAll]);
  } catch (e) {
    this.handleError(`Kill Watcher received an error: ${e.message}`, 'critical', e);
  } finally {
    if (yield cancelled()) {
      this.handleLog('warn', 'Task Managers Kill Watcher was cancelled');
    }
  }
}
