import { spawn } from 'redux-saga/effects';
import { runProcesses } from 'redux-saga-process';

/**
 * rootSage is a generator function which is called to instatiate our sagas.
 */
export default function* rootSaga() {
  /* Run our Processes */
  yield spawn(runProcesses);
}
