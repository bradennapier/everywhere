/* global annyang */
import { call, put } from 'redux-saga/effects';

import SagaObservable from 'saga-observable';

export default function* speechRecognitionObserver() {
  let observer;
  try {
    observer = new SagaObservable({ name: 'authenticationObserver' });

    annyang.removeCommands();

    annyang.addCommands({
      'go to :route': (...args) => observer.publish('goto', ...args),
      'center projects': (...args) =>
        observer.publish('centerProjects', ...args),
      'center my location': (...args) =>
        observer.publish('centerUser', ...args),
      'create project': (...args) =>
        observer.publish('createProject', ...args),
      menu: (...args) => observer.publish('menu', ...args),
      close: (...args) => observer.publish('close', ...args),
    });

    console.log('Speech Recognition Starting!');

    annyang.start();

    while (true) {
      const response = yield call([observer, observer.next]);

      yield put({
        type: 'SFX',
        effect: 'success',
      });
      console.log('Speech Response! ', response);

      switch (response[0]) {
        case 'createProject': {
          yield put({
            type: 'ON_MODAL_OPEN',
            id: 'ProjectCreate',
          });
          break;
        }
        case 'menu': {
          yield put({
            type: 'MAIN_MENU',
            toggle: true,
          });
          break;
        }
        case 'close': {
          yield put({
            type: 'KEY_ESCAPE',
          });
          break;
        }
        default: {
          console.warn('speechObserver Default Clause Reached');
          break;
        }
      }
    }
  } catch (e) {
    console.error(`Catch Called in Auth Observer: ${e.message}`);
  } finally {
    if (yield observer.cancelled()) {
      // Handle Cancelled
    }
  }
}
