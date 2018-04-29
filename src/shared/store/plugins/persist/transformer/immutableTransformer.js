import Immutable from 'seamless-immutable';
import { createTransform } from 'redux-persist';

const fromImmutable = state => {
  if (Immutable.isImmutable(state)) {
    return Immutable.asMutable(state, { deep: true });
  }
  return state;
};

const toImmutable = raw => Immutable.from(raw);
export default createTransform(
  // transform state coming from redux on its way to being serialized and stored
  raw => fromImmutable(raw),
  // transform state coming from storage, on its way to be rehydrated into redux
  state => toImmutable(state),
  // configuration options
);
