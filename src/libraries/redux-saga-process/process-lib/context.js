/** @module redux-saga-process */
import { createTaskManager, killAllTaskManagers } from 'saga-task-manager';

/*
  Built processes are stored within the Map so that they may later be referenced
  and ran when required.
*/
const Processes = new Map();

// WeakMap storing all running processes current configuration / schema
// which can be parsed to build our resulting reducers, actions, and selectors.
const ProcessSchema = new WeakMap();
const Compiled = new Map();

let SharedSchema; // eslint-disable-line

const DO_NOT_MONITOR = Symbol.for('@@saga-process-manager/$DO_NOT_MONITOR');
const IS_PROCESS = Symbol.for('@@saga-process-manager/$isProcess');

/**
 * An array defining the valid properties that can be added to a
 * Process as static Properties.
 * @type {Array}
 */
const ProcessProperties = [
  'config',
  'actionRoutes',
  'actionCreators',
  'initialState',
  'reducer',
  'selectors',
  'cancelTypes',
  'startOnAction',
  'loadProcess',
  'loadOnAction',
];

/*
  Our RootTasks stores each process and its root tasks.  This allows us to
  handle each individual process through the spawned tasks / lifecycle.  This
  is important because of the changes made to redux-saga that make fork a blocking
  effect at the end of the day.
*/
let RootTasks; // eslint-disable-line

/**
 * defaultSharedSchema
 * @return {[type]} [description]
 */
const getDefaultSharedSchema = () => new Map([['initialState', new Map()], ['reducer', new Map()]]);

/**
 * getDefaultProcessSchema
 * @return {[type]} [description]
 */
const getDefaultProcessSchema = () => ({
  config: {},
});

/**
 * getDefaultCompieldConfig
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
const getDefaultCompiledConfig = config => ({
  log: false,
  transformTypes: true,
  wildcard: true,
  optimizeReducers: true,
  hasReducerWildcardTypes: false,
  promise: Promise,
  ...config,
});

/**
 * processIsRunning
 * @param  {[type]} proc [description]
 * @return {[type]}      [description]
 */
function processIsRunning(proc) {
  return proc.schema.instance !== undefined;
}

/**
 * isProcess
 * @param  {[type]}  o [description]
 * @return {Boolean}   [description]
 */
function isProcess(o) {
  return typeof o === 'function' && Object.getPrototypeOf(o) && Object.getPrototypeOf(o).isProcess === IS_PROCESS;
}

/**
 * setContextDefaults
 * @param {[type]} config [description]
 */
function setContextDefaults(config) {
  Compiled.set('config', getDefaultCompiledConfig(config));
  if (SharedSchema) {
    SharedSchema.set('hot', true);
  } else {
    SharedSchema = new Map(getDefaultSharedSchema());
  }
}

function* buildTaskManager() {
  let killPromise;
  if (SharedSchema.get('hot')) {
    killPromise = killAllTaskManagers();
  }
  const config = Compiled.get('config');
  RootTasks = createTaskManager('root', {
    name: 'ROOT',
    log: config.log,
  });
  return killPromise;
}

export {
  ProcessProperties,
  Processes,
  ProcessSchema,
  Compiled,
  SharedSchema,
  RootTasks,
  setContextDefaults,
  getDefaultProcessSchema,
  buildTaskManager,
  processIsRunning,
  isProcess,
  DO_NOT_MONITOR,
  IS_PROCESS,
};
