import Immutable from 'seamless-immutable';

export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  return (inputState = Immutable({}), action) => {
    let newState = Immutable(inputState);

    reducerKeys.forEach(reducerName => {
      const reducer = reducers[reducerName];
      const reducerState = inputState[reducerName];
      newState = Immutable.set(newState, reducerName, reducer(reducerState, action));
    });

    return newState;
  };
}
