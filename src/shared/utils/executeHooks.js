/* @flow */

export type HooksFunction = (...args: Array<any>) => Promise<any> | any;

/**
 * Called when an array of hooks should be executed.  Generally args will simply
 * be [AppStateDescriptor] but any extra arguments sent to executeHooks will be
 * sent to all the plugins as well.
 * @param  {Array<HookFunction>} hooks [description]
 * @param  {[type]} args  [description]
 * @return {[type]}       [description]
 */
const executeHooks = (
  hooks: Map<string, HooksFunction>,
  ...args: Array<any>
) =>
  Promise.all([...hooks.values()].filter(Boolean).map(hook => hook(...args)));

export default executeHooks;
