/* @flow */
import Immutable from 'seamless-immutable';
import { LOCATION_CHANGE } from 'react-router-redux';

const initialState = Immutable.from({
  location: null,
});

export default function routerReducer(
  state = initialState,
  { type, payload },
) {
  if (type === LOCATION_CHANGE) {
    return Immutable.set(state, 'location', payload);
  }
  return state;
}
