import _ from 'lodash';
import invokeIf from 'invoke-if';
import ToReduxType from 'to-redux-type';

import saveToSharedSchema from '../utils/saveToSharedSchema';

/**
 * parseActionCreators
 * @param  {[type]} proc         [description]
 * @param  {[type]} SharedSchema [description]
 * @param  {[type]} Compiled     [description]
 * @return {[type]}              [description]
 */
export default function parseSagaProcessActionCreators(
  proc,
  SharedSchema /* Compiled */,
) {
  const { schema } = proc;
  const { actionCreators = {} } = schema;
  if (!schema.compiled) {
    schema.compiled = {};
  }
  for (const actionCreatorKey of Object.keys(actionCreators)) {
    buildActionCreator(
      actionCreatorKey,
      actionCreators[actionCreatorKey],
      proc,
    );
  }
  return saveToSharedSchema('compiled.public', 'actions', proc, SharedSchema);
}

function createActionCreator(type, keys = [], merge = {}) {
  const _action = { type, ...merge };
  return (...args) => {
    const action = {};
    for (const key of keys) {
      action[key] = args.shift();
    }
    return Object.assign(
      {
        ..._action,
        ...action,
      },
      ...args,
    );
  };
}

function buildActionCreator(actionCreatorKey, actionCreator, proc) {
  const { schema } = proc;

  const scope = actionCreatorKey.startsWith('!') ? 'private' : 'public';

  invokeIf(
    [
      [
        scope === 'private',
        () => {
          actionCreatorKey = actionCreatorKey.slice(1);
        },
      ],
    ],
    [
      [
        () => !schema.compiled[scope],
        () => {
          schema.compiled[scope] = {};
        },
      ],
    ],
    [
      [
        () => !schema.compiled[scope].actions,
        () => {
          schema.compiled[scope].actions = {};
        },
      ],
    ],
  );

  const type = ToReduxType(actionCreatorKey);

  let creatorFn;

  if (Array.isArray(actionCreator)) {
    if (typeof actionCreator[0] === 'object') {
      // use the object to create the action, rest used as args
      const merge = actionCreator[0];
      creatorFn = createActionCreator(type, actionCreator.slice(1), merge);
    } else {
      creatorFn = createActionCreator(type, actionCreator);
    }
  } else if (_.isPlainObject(actionCreator)) {
    creatorFn = createActionCreator(type, [], actionCreator);
  } else {
    creatorFn = createActionCreator(type);
  }

  Object.assign(schema.compiled[scope].actions, {
    [actionCreatorKey]: creatorFn,
  });
}
