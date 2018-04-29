/** @module redux-saga-process */
import { call } from 'redux-saga/effects';
import { delay } from 'redux-saga';

import { Processes, ProcessSchema, Compiled, RootTasks, SharedSchema, buildTaskManager } from './context';

import subscribeToTypesSaga from './sagas/subscribeToTypes';
import asynchronouslyLoadProcessSaga from './sagas/asynchronouslyLoadProcess';
import addSchemaToInstance from './utils/addSchemaToInstance';

import { getTypePattern } from './utils/typeUtils';

/**
 * runProcesses
 * @return {Generator} [description]
 */
export function* runProcesses() {
  try {
    yield call(buildTaskManager);
    for (const [processID, processor] of Processes) {
      const proc = {
        processID,
        processor,
        schema: ProcessSchema.get(processor),
      };
      yield call([RootTasks, RootTasks.create], 'processes', processID, runProcess, proc);
    }
  } catch (e) {
    console.error(e);
  }
}

export function* runProcessByID(processID) {
  try {
    const processor = Processes.get(processID);
    if (!processor) {
      console.error('Failed to Find Process with ID: ', processID);
      return;
    }
    const proc = {
      processID,
      processor,
      schema: ProcessSchema.get(processor),
    };
    yield call([RootTasks, RootTasks.create], 'processes', processID, runProcess, proc);
  } catch (e) {
    console.error(e);
  }
}

/**
 * runProcess
 * @param  {[type]}    proc [description]
 * @return {Generator}      [description]
 */
function* runProcess(proc) {
  const { processID, processor: Processor, schema } = proc;
  // console.log('Run Process: ', processID, schema);
  let prevState;

  let instances = SharedSchema.get('instances');

  if (instances && instances.has(processID)) {
    const instance = instances.get(processID);
    prevState = instance.state;
  }

  // TODO: This delay is required because killing the previous processes is an
  //       asynchronous request during a re-run -- we need to simply enter the
  //       event loop and let the waiting events flush before we continue.
  //       -- This should likely be handled by getting ahold of the tasks
  //          and join them to await their completion instead.
  if (SharedSchema.get('hot')) {
    yield call(delay);
  }

  // We need to refresh the value after the delay so we make sure we are
  // working with the latest version.
  instances = SharedSchema.get('instances') || new Map();

  if (!schema.instance) {
    // Construct the Process if we haven't already
    schema.instance = new Processor(processID, prevState, proc);
  }

  schema.instance.processID = processID;

  instances.set(processID, schema.instance);
  SharedSchema.set('instances', instances);

  yield call(addSchemaToInstance, schema.instance, schema);

  const compiledConfig = Compiled.get('config');

  const monitorConfig = {
    wildcard: compiledConfig.wildcard === true && schema.config.wildcard === true,
    hasWildcard: false,
  };

  if (schema.loadOnAction || schema.loadProcess) {
    // handle asynchronously created process

    const loadOnPattern =
      schema.loadOnAction &&
      getTypePattern(schema.loadOnAction, {
        ...monitorConfig,
        // indicates that objects should be matched instead of using
        // its keys.
        plainObject: 'matches',
      });

    yield call([schema.instance, asynchronouslyLoadProcessSaga], proc, loadOnPattern, SharedSchema);
  }

  if (schema.actionRoutes || schema.cancelTypes) {
    // console.log('Subscribe to Types');
    yield call(
      [RootTasks, RootTasks.create],
      processID,
      'subscribeToTypes',
      [schema.instance, subscribeToTypesSaga],
      proc,
      monitorConfig,
      compiledConfig,
    );
  }

  if (!schema.async && typeof schema.instance.processStarts === 'function') {
    yield call(
      [RootTasks, RootTasks.create],
      processID,
      'processStarts',
      [schema.instance, schema.instance.processStarts],
      processID,
    );
  }
}
