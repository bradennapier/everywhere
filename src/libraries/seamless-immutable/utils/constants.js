/* @flow */

// https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L21
export const REACT_ELEMENT_TYPE =
  typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element');

export const REACT_ELEMENT_TYPE_FALLBACK = 0xeac7;

export const IMMUTABLE = Symbol.for('__immutable_invariants_hold');
