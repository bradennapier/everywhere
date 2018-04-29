/* @flow */
import Immutable from 'seamless-immutable';

export default function stateTransformer(state) {
  if (typeof state === 'object' && Immutable.isImmutable(state)) {
    return Immutable.asMutable(state, { deep: true });
  }
  return state;
}
