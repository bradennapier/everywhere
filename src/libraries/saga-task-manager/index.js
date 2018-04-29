/* @flow */

import {
  cancel,
  fork,
  spawn,
  call,
  take,
  race,
  // join,
} from 'redux-saga/effects';

import { TASK } from 'redux-saga/utils';
import { CANCEL, delay } from 'redux-saga';

import printLog from './utils/logger';
import handleTaskCleanup from './utils/handleTaskCleanup';
import onKillWatcher from './sagas/onKillWatcher';

import { TASKMAN, TaskManagers } from './utils/context';

const CreateSagaPromise = (Prom: Class<Promise<*>>, handler, oncancel) => {
  const SagaPromise = new Prom(handler);
  SagaPromise[CANCEL] = oncancel;
  return SagaPromise;
};

export type TaskManager$SetConfig = {
  name?: string,
  overwrite?: boolean,
  silent?: boolean,
  log?: boolean,
  logCollapsed?: boolean,
  icon?: string,
};

export type TaskManager$Config = {
  name: string,
  overwrite: boolean,
  silent: boolean,
  log: boolean,
  logCollapsed: boolean,
  icon: string,
};

export type TaskManager$TaskContext = {
  id: string,
  category: string,
  created?: number,
};

export type TaskManager$Function = <A, R>(
  ...args: Array<A>
) => R | [any, <A, R>(...args: Array<A>) => R];

const buildConfig = (config?: TaskManager$SetConfig): TaskManager$Config => ({
  name: 'SagaTaskMan',
  // should we cancel tasks if we schedule new tasks with same category, id?
  // if this is false then an error will be reported unless silent is true
  // at which point nothing will happen unless the task is cancelled first.
  overwrite: true,
  // do we want to supress errors and fail silently?
  silent: false,
  // do we want to log internal functions
  log: false,
  logCollapsed: true,
  icon: '📟',
  ...config,
});

class SagaTaskMan {
  id: string;

  config: TaskManager$Config;

  tasks: Map<string, Object>;

  handlers: {
    promises: Map<string, Promise<*>>,
    resolvers: Map<string, Promise<*>>,
  };

  handleLog: (...args: Array<mixed>) => void;

  logger: console.groupCollapsed | console.group;

  killed: boolean = false;

  constructor(id: string, config?: TaskManager$SetConfig) {
    this.id = id;

    this.config = buildConfig(config);

    this.tasks = new Map();

    this.handlers = {
      promises: new Map(),
      resolvers: new Map(),
    };

    if (this.config.log) {
      this.logger = this.config.logCollapsed
        ? console.groupCollapsed
        : console.group;
      this.handleLog = printLog.bind(this);
      this.handleLog('info', 'Task Manager Constructed', this.config);
    } else {
      this.handleLog = () => {};
    }
    this.create = this.create.bind(this);
    this.createHandler('onKilled');
  }

  getName = (): string => this.config.name;

  * in(
    ms: number,
    category: string,
    id: string,
    fn: TaskManager$Function,
    ...args: Array<any>
  ): Generator<*, *, *> {
    return yield call(
      [this, this.create],
      category,
      id,
      [this, this.runIn],
      [category, id],
      ms,
      fn,
      ...args,
    );
  }

  * take(
    effect,
    category: string,
    id: string,
    fn: TaskManager$Function,
    ...args: Array<any>
  ): Generator<*, *, *> {
    return yield call(
      [this, this.create],
      category,
      id,
      [this, this.runTake],
      effect,
      fn,
      ...args,
    );
  }

  * takeWithin(
    effect: string | Array<string>,
    ms: number,
    category: string,
    id: string,
    fn: TaskManager$Function,
    ...args: Array<any>
  ): Generator<*, *, *> {
    return yield call(
      [this, this.create],
      category,
      id,
      [this, this.runTakeWithin],
      effect,
      ms,
      fn,
      ...args,
    );
  }

  * create(
    category: string,
    id: string,
    fn: TaskManager$Function,
    ...args: Array<any>
  ): Generator<*, *, *> {
    const taskContext: TaskManager$TaskContext = { category, id };
    if (this.config.log) {
      taskContext.created = performance.now();
    }
    if (!category || !id || !fn) {
      const [c, i] = this.setToStringIfNeeded(category, id);
      return this.handleError(
        `Tasks must have a category, id, and fn at a minimum but received ${c}.${i} - ${fn}`,
        'critical',
      );
    }
    try {
      let prevTask;
      if (this.config.overwrite) {
        prevTask = yield call([this, this.cancel], category, id);
      } else if (yield call([this, this.taskExists], category, id)) {
        const [c, i] = this.setToStringIfNeeded(category, id);
        return this.handleError(`When overwrite config is set to false, you must cancel tasks before scheduling them again.  While Creating Task: ${c}.${i}`);
      }

      const task = yield spawn(
        [this, this.run],
        [category, id, prevTask],
        fn,
        ...args,
      );

      task[TASKMAN] = taskContext;
      task.setContext(taskContext);

      this.saveTask(category, id, task, args);

      if (this.config.log) {
        const [c, i] = this.setToStringIfNeeded(category, id);
        this.handleLog(
          'info',
          `Task Created: ${c}.${i}`,
          ['%c Category: ', 'font-weight: bold;', c],
          ['%c ID: ', 'font-weight: bold;', i],
        );
      }

      yield spawn([this, this.onTaskComplete], category, id, [
        this,
        handleTaskCleanup,
      ]);

      if (!this.killWatcher) {
        this.killWatcher = yield spawn([this, onKillWatcher]);
      }
    } catch (e) {
      const [c, i] = this.setToStringIfNeeded(category, id);
      this.handleError(`Failed to create task: (${c}.${i}): ${e.message}`, e);
      throw e;
    }
  }

  // allows us to handle a delayed execution command within a
  // task context that can be cancelled.
  * runIn(
    task: [string, string],
    ms: number,
    fn: TaskManager$Function,
    ...args: Array<mixed>
  ): Generator<*, *, *> {
    let result;
    try {
      yield call(delay, ms);
      result = yield call(fn, ...args);
    } catch (e) {
      /* When an error occurs at this level we do not throw it further.  We do this because
         since we are the root level of a spawn, throwing further will not propagate to any
         handlers that have been created anyway.  Instead we will report the error.
      */

      const [category: string, id: string] = this.setToStringIfNeeded(
        task[0],
        task[1],
      );
      this.handleError(
        `uncaught while running a delayed task ${category}.${id} (after ${ms}ms): ${
          e.message
        }`,
        'critical',
        e,
        false,
      );
      result = e;
    }
    return result;
  }

  // takes the given value using yield take() and executes the
  // function once it has been received with the result prepended
  // to the given arguments
  * runTake(effect, fn: TaskManager$Function, ...args): Generator<*, *, *> {
    const action = yield take(effect);
    return yield call(fn, action, ...args);
  }

  // takes the given value as long as it occurs within the given
  // timeout period.
  * runTakeWithin(
    effect: string | Array<string>,
    ms: number,
    fn: TaskManager$Function,
    ...args: Array<mixed>
  ): Generator<*, *, *> {
    const { action } = yield race({
      action: take(effect),
      timeout: call(delay, ms),
    });
    const status = action ? 'success' : 'timeout';
    return yield call(fn, status, action, ...args);
  }

  /*
    Before calling the task we spawn here so that we can catch any errors
    that may occur during the execution of the task.
  */ * run(
    task,
    fn: TaskManager$Function,
    ...args: Array<any>
  ): Generator<*, *, *> {
    let result;
    try {
      const prevTask = task[2];
      if (prevTask) {
        /* While we do not require this delay (our task cleanup is smart enough),
           it would seem to make sense that we should allow the pending cancellation
           to run before we continue with the process of creating a task that is begin
           overwritten.

           The idea here is that since task cancellation is non-blocking, a 1ms delay
           should allow at least the finally blocks to run for the cancelled task
           before the same task is run again, reducing the chance of conflict from
           within the cleanup.
        */
        yield call(delay, 1);
      }
      result = yield call(fn, ...args);
    } catch (e) {
      /* When an error occurs at this level we do not throw it further.  We do this because
         since we are the root level of a spawn, throwing further will not propagate to any
         handlers that have been created anyway.  Instead we will report the error.
      */

      const [category: string, id: string] = this.setToStringIfNeeded(
        task[0],
        task[1],
      );

      this.handleError(
        `uncaught while running task ${category}.${id}: ${e.message}`,
        'critical',
        e,
        false,
      );
      result = e;
    }
    return result;
  }

  * onTaskComplete(
    category: string,
    id: string,
    fn: TaskManager$Function,
  ): Generator<*, *, *> {
    const task = this.getTask(category, id);
    if (!fn) {
      return null;
    }
    if (!task || !task[TASK] || task.done === undefined) {
      const [c, i] = this.setToStringIfNeeded(category, id);
      return this.handleError(`Task Does Not Exist: ${c}.${i}`);
    }
    try {
      yield task.done;
    } finally {
      try {
        yield call(fn, category, id, task);
        if (this.config.log) {
          const [c, i] = this.setToStringIfNeeded(category, id);
          let result = task.result();
          if (typeof result === 'symbol') {
            result = result.toString();
          }
          const context = task[TASKMAN];
          let elapsed =
            context && context.created && performance.now() - context.created;
          if (elapsed > 60000) {
            elapsed = Math.round(elapsed);
          }
          const logs = [
            [
              '%c Duration (MS): ',
              'font-weight: bold; color: darkgreen;',
              elapsed,
            ],
          ];
          if (result === undefined) {
            logs.push([
              '%c Result: ',
              'font-weight: bold; color: darkgreen;',
              'undefined',
            ]);
          } else if (result instanceof Error) {
            logs.push(
              [
                '%c Result: ',
                'font-weight: bold; color: red;',
                result.message,
              ],
              result,
            );
          } else {
            logs.push([
              '%c Result: ',
              'font-weight: bold; color: darkgreen;',
              result,
            ]);
          }
          this.handleLog(
            'info',
            `Task Complete: ${c}.${i}`,
            ['%c Category: ', 'font-weight: bold;', c],
            ['%c ID: ', 'font-weight: bold;', i],
            ...logs,
          );
        }
      } catch (e) {
        const [c, i] = this.setToStringIfNeeded(category, id);
        this.handleError(
          `uncaught while running onTaskComplete function --> ${c}.${i}: ${
            e.message
          }`,
          'critical',
          e,
          false,
        );
      }
    }
  }

  handleCancelled = handler => this.removeHandler(handler);

  * cancel(category: string, id: string): Generator<*, *, *> {
    if (!id) {
      return yield call([this, this.cancelCategory], category);
    }
    const categoryTasks = this.getCategory(category);
    if (!categoryTasks) {
      return;
    }
    return yield call([this, this.cancelTask], categoryTasks, category, id);
  }

  * cancelCategory(category: string): Generator<*, *, *> {
    const categoryTasks = this.getCategory(category);
    if (!categoryTasks) {
      return;
    }
    const tasks = [];
    for (const [id, task] of categoryTasks) {
      tasks.push(yield fork([this, this.cancelTask], categoryTasks, category, id, task));
    }
    return tasks;
  }

  * cancelAll(): Generator<*, *, *> {
    const tasks = [];
    for (const [category] of this.tasks) {
      tasks.push(yield fork([this, this.cancelCategory], category));
    }
    return tasks;
  }

  * cancelTask(tasks, category: string, id: string, task): Generator<*, *, *> {
    // console.warn('CANCEL TASK: ', category, id, task)
    if (!task && !tasks.has(id)) {
      return;
    }
    task = task || tasks.get(id);
    if (task && task[TASK] && task.isRunning()) {
      yield cancel(task);
    }
    tasks.delete(id);
    if (tasks.size === 0) {
      this.tasks.delete(category);
    }
    return task;
  }

  taskExists = (category: string, id: string): boolean => {
    if (this.getTask(category, id)) {
      return true;
    }
    return false;
  };

  awaitHandler = handler => this.handlers.promises.get(handler);

  getCategory = (category: string, createIfNeeded?: boolean = false) => {
    let categoryTasks;
    if (this.tasks.has(category)) {
      categoryTasks = this.tasks.get(category);
    } else if (createIfNeeded) {
      categoryTasks = this.createCategory(category);
    }
    return categoryTasks;
  };

  createCategory = category => {
    let categoryTasks;
    if (this.tasks.has(category)) {
      categoryTasks = this.tasks.get(category);
    } else {
      this.createHandler(`onCategory.${category}`);
      categoryTasks = new Map();
      this.tasks.set(category, categoryTasks);
    }
    return categoryTasks;
  };

  getTask = (category: string, id: string): void => {
    const categoryTasks = this.getCategory(category);
    if (categoryTasks) {
      return categoryTasks.get(id);
    }
  };

  getAllTasks = () => this.tasks;

  saveTask = (category: string, id: string, task): void => {
    const categoryTasks = this.getCategory(category, true);
    if (categoryTasks) {
      if (categoryTasks.has(id)) {
        const [c, i] = this.setToStringIfNeeded(category, id);
        this.handleError(
          `Failed to Save Task, ${c}.${i} already exists`,
          'critical',
        );
      } else {
        categoryTasks.set(id, task);
      }
    }
  };

  handleCategoryComplete = category => {
    const handler = this.handlers.resolvers.get(`onCategory.${category}`);
    if (!handler) {
      this.handleLog(
        'warn',
        `Tried to cancel ${category} but it was not found in resolvers!`,
      );
    } else {
      handler.resolve();
    }
  };

  handleError = (
    msg: string,
    level?: string = 'error',
    e?: Error,
    shouldThrow?: boolean = true,
    fn?: Function,
  ): void => {
    this.handleLog('error', msg, e, fn);
    if (shouldThrow) {
      if (this.config.silent === true && level !== 'critical') {
        return;
      }
      if (this.config.silent === 'critical') {
        return;
      }
      throw new Error(`[${this.getName()}] ${msg}`);
    } else if (level === 'critical') {
      console.error(msg);
    }
  };

  createHandler = (handler, ...args) =>
    this.handlers.promises.set(
      handler,
      CreateSagaPromise(
        Promise,
        (resolve, reject) =>
          this.handlers.resolvers.set(handler, { resolve, reject }),
        () => this.handleCancelled(handler, ...args),
      )
        .then(r => {
          this.removeHandler(handler);
          return r;
        })
        .catch(err => {
          this.removeHandler(handler);
          throw err;
        }),
    );

  removeHandler = handler => {
    this.handlers.resolvers.delete(handler);
    this.handlers.promises.delete(handler);
  };

  kill = (): void | Promise<*> => {
    if (this.killed) {
      this.handleLog(
        'warn',
        'Process is already killed but you called kill on it again!',
      );
      return;
    }
    this.killed = true;

    const killPromise = this.handlers.promises
      .get('onKilled')
      .then(r => {
        if (!this.deleted) {
          TaskManagers.delete(this.id);
        }
        return r;
      })
      .catch(err => {
        this.handleError(
          `Failed to Kill Task Manager: ${err.message}`,
          'critical',
        );
        if (!this.deleted) {
          TaskManagers.delete(this.id);
        }
        return err;
      });

    this.handlers.resolvers.get('onKilled').resolve();

    return killPromise;
  };

  setToStringIfNeeded = (category: string, id: string) => {
    let c;
    let i;
    if (typeof category === 'symbol') {
      c = category.toString();
    } else {
      c = category;
    }
    if (typeof id === 'symbol') {
      i = id.toString();
    } else {
      i = id;
    }
    return [c, i];
  };
}

function createTaskManager(
  id: string,
  config: TaskManager$SetConfig,
): SagaTaskMan {
  if (TaskManagers.has(id)) {
    const oldManager = TaskManagers.get(id);
    if (!oldManager.killed) {
      oldManager.kill();
    }
  }
  const taskman = new SagaTaskMan(id, config);
  TaskManagers.set(id, taskman);
  return taskman;
}

function killAllTaskManagers(reversed?: boolean = true): void | Promise<*> {
  let managers = [...TaskManagers];
  // kill newest to oldest if reversed (default)
  if (reversed) {
    managers = managers.reverse();
  }
  const killPromises: Array<Promise<*>> = [];
  for (const [managerID, manager] of managers) {
    const killPromise = manager.kill();
    // manually mark deleted so no conflicts exists
    // while the kill resolves asynchronously.
    TaskManagers.delete(managerID);
    manager.deleted = true;
    killPromises.push(killPromise);
  }
  if (killPromises.length > 0) {
    return Promise.all(killPromises);
  }
}

export { createTaskManager, TaskManagers, killAllTaskManagers };
