/* @flow */
/** @module seamless-immutable */
import { REACT_ELEMENT_TYPE, REACT_ELEMENT_TYPE_FALLBACK, IMMUTABLE } from './utils/constants';

import {
  mutatingObjectMethods,
  nonMutatingObjectMethods,
  mutatingArrayMethods,
  nonMutatingArrayMethods,
  mutatingDateMethods,
} from './utils/methods';

function isObject(data) {
  return typeof data === 'object' && !Array.isArray(data) && data !== null;
}

function instantiateEmptyObject(obj) {
  const prototype = Object.getPrototypeOf(obj);
  if (!prototype) {
    return {};
  }
  return Object.create(prototype);
}

function addPropertyTo(target, methodName, value) {
  Object.defineProperty(target, methodName, {
    enumerable: false,
    configurable: false,
    writable: false,
    value,
  });
}

function banProperty(target, methodName) {
  addPropertyTo(target, methodName, () => {
    throw new ImmutableError(`The ${methodName} method cannot be invoked on an Immutable data structure.`);
  });
}

function addImmutabilityTag(target) {
  addPropertyTo(target, IMMUTABLE, true);
}

function isImmutable(target) {
  if (typeof target === 'object') {
    return target === null || Boolean(Object.getOwnPropertyDescriptor(target, IMMUTABLE));
  }
  // In JavaScript, only objects are even potentially mutable.
  // strings, numbers, null, and undefined are all naturally immutable.
  return true;
}

function isEqual(a, b) {
  // Avoid false positives due to (NaN !== NaN) evaluating to true
  return a === b || (a !== a && b !== b);
}

function isMergableObject(target) {
  return target !== null && typeof target === 'object' && !Array.isArray(target) && !(target instanceof Date);
}

function ImmutableError(message) {
  this.name = 'MyError';
  this.message = message;
  this.stack = new Error().stack;
}
ImmutableError.prototype = new Error();
ImmutableError.prototype.constructor = Error;

function makeImmutable(obj, bannedMethods) {
  // Tag it so we can quickly tell it's immutable later.
  addImmutabilityTag(obj);

  if (process.env.NODE_ENV !== 'production') {
    // Make all mutating methods throw exceptions.
    for (const index in bannedMethods) {
      if (bannedMethods.hasOwnProperty(index)) {
        banProperty(obj, bannedMethods[index]);
      }
    }

    // Freeze it and return it.
    Object.freeze(obj);
  }

  return obj;
}

function makeMethodReturnImmutable(obj, methodName) {
  const currentMethod = obj[methodName];

  addPropertyTo(obj, methodName, function () {
    return Immutable(currentMethod.apply(obj, arguments));
  });
}

function arraySet(idx, value, config) {
  const deep = config && config.deep;

  if (idx in this) {
    if (deep && this[idx] !== value && isMergableObject(value) && isMergableObject(this[idx])) {
      value = Immutable.merge(this[idx], value, {
        deep: true,
        mode: 'replace',
      });
    }
    if (isEqual(this[idx], value)) {
      return this;
    }
  }

  const mutable = asMutableArray.call(this);
  mutable[idx] = Immutable(value);
  return makeImmutableArray(mutable);
}

const immutableEmptyArray = Immutable([]);

function arraySetIn(pth, value, config) {
  const head = pth[0];

  if (pth.length === 1) {
    return arraySet.call(this, head, value, config);
  }
  const tail = pth.slice(1);
  const thisHead = this[head];
  let newValue;

  if (typeof thisHead === 'object' && thisHead !== null) {
    // Might (validly) be object or array
    newValue = Immutable.setIn(thisHead, tail, value);
  } else {
    const nextHead = tail[0];
    // If the next path part is a number, then we are setting into an array, else an object.
    if (nextHead !== '' && isFinite(nextHead)) {
      newValue = arraySetIn.call(immutableEmptyArray, tail, value);
    } else {
      newValue = objectSetIn.call(immutableEmptyObject, tail, value);
    }
  }

  if (head in this && thisHead === newValue) {
    return this;
  }

  const mutable = asMutableArray.call(this);
  mutable[head] = newValue;
  return makeImmutableArray(mutable);
}

function makeImmutableArray(array) {
  // Don't change their implementations, but wrap these functions to make sure
  // they always return an immutable value.
  for (const index in nonMutatingArrayMethods) {
    if (nonMutatingArrayMethods.hasOwnProperty(index)) {
      const methodName = nonMutatingArrayMethods[index];
      makeMethodReturnImmutable(array, methodName);
    }
  }

  // if (!globalConfig.use_static) {
  //   addPropertyTo(array, 'flatMap', flatMap);
  //   addPropertyTo(array, 'asObject', asObject);
  //   addPropertyTo(array, 'asMutable', asMutableArray);
  //   addPropertyTo(array, 'set', arraySet);
  //   addPropertyTo(array, 'setIn', arraySetIn);
  //   addPropertyTo(array, 'update', update);
  //   addPropertyTo(array, 'updateIn', updateIn);
  //   addPropertyTo(array, 'getIn', getIn);
  // }

  for (let i = 0, length = array.length; i < length; i++) {
    array[i] = Immutable(array[i]);
  }

  return makeImmutable(array, mutatingArrayMethods);
}

function makeImmutableDate(date) {
  // if (!globalConfig.use_static) {
  //   addPropertyTo(date, 'asMutable', asMutableDate);
  // }

  return makeImmutable(date, mutatingDateMethods);
}

function asMutableDate() {
  return new Date(this.getTime());
}

/**
 * Effectively performs a map() over the elements in the array, using the
 * provided iterator, except that whenever the iterator returns an array, that
 * array's elements are added to the final result instead of the array itself.
 *
 * @param {function} iterator - The iterator function that will be invoked on each element in the array. It will receive three arguments: the current value, the current index, and the current object.
 */
function flatMap(iterator) {
  // Calling .flatMap() with no arguments is a no-op. Don't bother cloning.
  if (arguments.length === 0) {
    return this;
  }

  let result = [],
    length = this.length,
    index;

  for (index = 0; index < length; index++) {
    const iteratorResult = iterator(this[index], index, this);

    if (Array.isArray(iteratorResult)) {
      // Concatenate Array results into the return value we're building up.
      result.push(...iteratorResult);
    } else {
      // Handle non-Array results the same way map() does.
      result.push(iteratorResult);
    }
  }

  return makeImmutableArray(result);
}

/**
 * Returns an Immutable copy of the object without the given keys included.
 *
 * @param {array} keysToRemove - A list of strings representing the keys to exclude in the return value. Instead of providing a single array, this method can also be called by passing multiple strings as separate arguments.
 */
function without(remove) {
  // Calling .without() with no arguments is a no-op. Don't bother cloning.
  if (typeof remove === 'undefined' && arguments.length === 0) {
    return this;
  }

  if (typeof remove !== 'function') {
    // If we weren't given an array, use the arguments list.
    const keysToRemoveArray = Array.isArray(remove) ? remove.slice() : Array.prototype.slice.call(arguments);

    // Convert numeric keys to strings since that's how they'll
    // come from the enumeration of the object.
    keysToRemoveArray.forEach((el, idx, arr) => {
      if (typeof el === 'number') {
        arr[idx] = el.toString();
      }
    });

    remove = function (val, key) {
      return keysToRemoveArray.indexOf(key) !== -1;
    };
  }

  const result = instantiateEmptyObject(this);

  for (const key in this) {
    if (this.hasOwnProperty(key) && remove(this[key], key) === false) {
      result[key] = this[key];
    }
  }

  return makeImmutableObject(result);
}

function asMutableArray(opts) {
  let result = [],
    i,
    length;

  if (opts && opts.deep) {
    for (i = 0, length = this.length; i < length; i++) {
      result.push(asDeepMutable(this[i]));
    }
  } else {
    for (i = 0, length = this.length; i < length; i++) {
      result.push(this[i]);
    }
  }

  return result;
}

/**
 * Effectively performs a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) over the elements in the array, expecting that the iterator function
 * will return an array of two elements - the first representing a key, the other
 * a value. Then returns an Immutable Object constructed of those keys and values.
 *
 * @param {function} iterator - A function which should return an array of two elements - the first representing the desired key, the other the desired value.
 */
function asObject(iterator) {
  // If no iterator was provided, assume the identity function
  // (suggesting this array is already a list of key/value pairs.)
  if (typeof iterator !== 'function') {
    iterator = function (value) {
      return value;
    };
  }

  let result = {},
    length = this.length,
    index;

  for (index = 0; index < length; index++) {
    let pair = iterator(this[index], index, this),
      key = pair[0],
      value = pair[1];

    result[key] = value;
  }

  return makeImmutableObject(result);
}

function asDeepMutable(obj) {
  if (!obj || typeof obj !== 'object' || !Object.getOwnPropertyDescriptor(obj, IMMUTABLE) || obj instanceof Date) {
    return obj;
  }
  return Immutable.asMutable(obj, { deep: true });
}

function quickCopy(src, dest) {
  for (const key in src) {
    if (Object.getOwnPropertyDescriptor(src, key)) {
      dest[key] = src[key];
    }
  }

  return dest;
}

/**
 * Returns an Immutable Object containing the properties and values of both
 * this object and the provided object, prioritizing the provided object's
 * values whenever the same key is present in both objects.
 *
 * @param {object} other - The other object to merge. Multiple objects can be passed as an array. In such a case, the later an object appears in that list, the higher its priority.
 * @param {object} config - Optional config object that contains settings. Supported settings are: {deep: true} for deep merge and {merger: mergerFunc} where mergerFunc is a function
 *                          that takes a property from both objects. If anything is returned it overrides the normal merge behaviour.
 */
function merge(other, config) {
  // Calling .merge() with no arguments is a no-op. Don't bother cloning.
  if (arguments.length === 0) {
    return this;
  }

  if (other === null || typeof other !== 'object') {
    throw new TypeError(`Immutable#merge can only be invoked with objects or arrays, not ${JSON.stringify(other)}`);
  }

  let receivedArray = Array.isArray(other),
    deep = config && config.deep,
    mode = (config && config.mode) || 'merge',
    merger = config && config.merger,
    result;

  // Use the given key to extract a value from the given object, then place
  // that value in the result object under the same key. If that resulted
  // in a change from this object's value at that key, set anyChanges = true.
  function addToResult(currentObj, otherObj, key) {
    const immutableValue = Immutable(otherObj[key]);
    const mergerResult = merger && merger(currentObj[key], immutableValue, config);
    const currentValue = currentObj[key];

    if (
      result !== undefined ||
      mergerResult !== undefined ||
      !currentObj.hasOwnProperty(key) ||
      !isEqual(immutableValue, currentValue)
    ) {
      let newValue;

      if (mergerResult) {
        newValue = mergerResult;
      } else if (deep && isMergableObject(currentValue) && isMergableObject(immutableValue)) {
        newValue = Immutable.merge(currentValue, immutableValue, config);
      } else {
        newValue = immutableValue;
      }

      if (!isEqual(currentValue, newValue) || !currentObj.hasOwnProperty(key)) {
        if (result === undefined) {
          // Make a shallow clone of the current object.
          result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
        }

        result[key] = newValue;
      }
    }
  }

  function clearDroppedKeys(currentObj, otherObj) {
    for (const key in currentObj) {
      if (!otherObj.hasOwnProperty(key)) {
        if (result === undefined) {
          // Make a shallow clone of the current object.
          result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
        }
        delete result[key];
      }
    }
  }

  let key;

  // Achieve prioritization by overriding previous values that get in the way.
  if (!receivedArray) {
    // The most common use case: just merge one object into the existing one.
    for (key in other) {
      if (Object.getOwnPropertyDescriptor(other, key)) {
        addToResult(this, other, key);
      }
    }
    if (mode === 'replace') {
      clearDroppedKeys(this, other);
    }
  } else {
    // We also accept an Array
    for (let index = 0, length = other.length; index < length; index++) {
      const otherFromArray = other[index];

      for (key in otherFromArray) {
        if (otherFromArray.hasOwnProperty(key)) {
          addToResult(result !== undefined ? result : this, otherFromArray, key);
        }
      }
    }
  }

  if (result === undefined) {
    return this;
  }
  return makeImmutableObject(result);
}

function objectReplace(value, config) {
  const deep = config && config.deep;

  // Calling .replace() with no arguments is a no-op. Don't bother cloning.
  if (arguments.length === 0) {
    return this;
  }

  if (value === null || typeof value !== 'object') {
    throw new TypeError(`Immutable#replace can only be invoked with objects or arrays, not ${JSON.stringify(value)}`);
  }

  return Immutable.merge(this, value, { deep, mode: 'replace' });
}

var immutableEmptyObject = Immutable({});

function objectSetIn(path, value, config) {
  if (!(path instanceof Array) || path.length === 0) {
    throw new TypeError('The first argument to Immutable#setIn must be an array containing at least one "key" string.');
  }

  const head = path[0];
  if (path.length === 1) {
    return objectSet.call(this, head, value, config);
  }

  const tail = path.slice(1);
  let newValue;
  const thisHead = this[head];

  if (this.hasOwnProperty(head) && typeof thisHead === 'object' && thisHead !== null) {
    // Might (validly) be object or array
    newValue = Immutable.setIn(thisHead, tail, value);
  } else {
    newValue = objectSetIn.call(immutableEmptyObject, tail, value);
  }

  if (this.hasOwnProperty(head) && thisHead === newValue) {
    return this;
  }

  const mutable = quickCopy(this, instantiateEmptyObject(this));
  mutable[head] = newValue;
  return makeImmutableObject(mutable);
}

function objectSet(property, value, config) {
  const deep = config && config.deep;

  if (this.hasOwnProperty(property)) {
    if (deep && this[property] !== value && isMergableObject(value) && isMergableObject(this[property])) {
      value = Immutable.merge(this[property], value, {
        deep: true,
        mode: 'replace',
      });
    }
    if (isEqual(this[property], value)) {
      return this;
    }
  }

  const mutable = quickCopy(this, instantiateEmptyObject(this));
  mutable[property] = Immutable(value);
  return makeImmutableObject(mutable);
}

function update(property, updater) {
  const restArgs = Array.prototype.slice.call(arguments, 2);
  const initialVal = this[property];
  return Immutable.set(this, property, updater.apply(initialVal, [initialVal].concat(restArgs)));
}

function getInPath(obj, path) {
  /* jshint eqnull:true */
  for (var i = 0, l = path.length; obj != null && i < l; i++) {
    obj = obj[path[i]];
  }

  return i && i == l ? obj : undefined;
}

function updateIn(path, updater) {
  const restArgs = Array.prototype.slice.call(arguments, 2);
  const initialVal = getInPath(this, path);

  return Immutable.setIn(this, path, updater.apply(initialVal, [initialVal].concat(restArgs)));
}

function getIn(path, defaultValue) {
  const value = getInPath(this, path);
  return value === undefined ? defaultValue : value;
}

function asMutableObject(opts) {
  let result = instantiateEmptyObject(this),
    key;

  if (opts && opts.deep) {
    for (key in this) {
      if (this.hasOwnProperty(key)) {
        result[key] = asDeepMutable(this[key]);
      }
    }
  } else {
    for (key in this) {
      if (this.hasOwnProperty(key)) {
        result[key] = this[key];
      }
    }
  }

  return result;
}

// Creates plain object to be used for cloning
function instantiatePlainObject() {
  return {};
}

// Finalizes an object with immutable methods, freezes it, and returns it.
function makeImmutableObject(obj) {
  // if (!globalConfig.use_static) {
  //   addPropertyTo(obj, 'merge', merge);
  //   addPropertyTo(obj, 'replace', objectReplace);
  //   addPropertyTo(obj, 'without', without);
  //   addPropertyTo(obj, 'asMutable', asMutableObject);
  //   addPropertyTo(obj, 'set', objectSet);
  //   addPropertyTo(obj, 'setIn', objectSetIn);
  //   addPropertyTo(obj, 'update', update);
  //   addPropertyTo(obj, 'updateIn', updateIn);
  //   addPropertyTo(obj, 'getIn', getIn);
  // }

  return makeImmutable(obj, mutatingObjectMethods);
}

// Returns true if object is a valid react element
// https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L326
function isReactElement(obj) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj.$$typeof === REACT_ELEMENT_TYPE_FALLBACK || obj.$$typeof === REACT_ELEMENT_TYPE)
  );
}

function isFileObject(obj) {
  return typeof File !== 'undefined' && obj instanceof File;
}

function isPromise(obj) {
  return typeof obj === 'object' && typeof obj.then === 'function';
}

function isError(obj) {
  return obj instanceof Error;
}

function Immutable(obj, options, stackRemaining) {
  if (isImmutable(obj) || isReactElement(obj) || isFileObject(obj) || isError(obj)) {
    return obj;
  } else if (isPromise(obj)) {
    return obj.then(Immutable);
  } else if (Array.isArray(obj)) {
    return makeImmutableArray(obj.slice());
  } else if (obj instanceof Date) {
    return makeImmutableDate(new Date(obj.getTime()));
  }
  // Don't freeze the object we were given; make a clone and use that.
  const prototype = options && options.prototype;
  const instantiateEmptyObject =
    !prototype || prototype === Object.prototype
      ? instantiatePlainObject
      : function () {
        return Object.create(prototype);
      };
  const clone = instantiateEmptyObject();

  if (process.env.NODE_ENV !== 'production') {
    /* jshint eqnull:true */
    if (stackRemaining == null) {
      stackRemaining = 64;
    }
    if (stackRemaining <= 0) {
      throw new ImmutableError('Attempt to construct Immutable from a deeply nested object was detected.' +
          ' Have you tried to wrap an object with circular references (e.g. React element)?' +
          ' See https://github.com/rtfeldman/seamless-immutable/wiki/Deeply-nested-object-was-detected for details.');
    }
    stackRemaining -= 1;
  }

  for (const key in obj) {
    if (Object.getOwnPropertyDescriptor(obj, key)) {
      clone[key] = Immutable(obj[key], undefined, stackRemaining);
    }
  }

  return makeImmutableObject(clone);
}

// Wrapper to allow the use of object methods as static methods of Immutable.
function toStatic(fn) {
  function staticWrapper() {
    const args = [].slice.call(arguments);
    const self = args.shift();
    return fn.apply(self, args);
  }

  return staticWrapper;
}

// Wrapper to allow the use of object methods as static methods of Immutable.
// with the additional condition of choosing which function to call depending
// if argument is an array or an object.
function toStaticObjectOrArray(fnObject, fnArray) {
  function staticWrapper() {
    const args = [].slice.call(arguments);
    const self = args.shift();
    if (Array.isArray(self)) {
      return fnArray.apply(self, args);
    }
    return fnObject.apply(self, args);
  }

  return staticWrapper;
}

// Wrapper to allow the use of object methods as static methods of Immutable.
// with the additional condition of choosing which function to call depending
// if argument is an array or an object or a date.
function toStaticObjectOrDateOrArray(fnObject, fnArray, fnDate) {
  function staticWrapper() {
    const args = [].slice.call(arguments);
    const self = args.shift();
    if (Array.isArray(self)) {
      return fnArray.apply(self, args);
    } else if (self instanceof Date) {
      return fnDate.apply(self, args);
    }
    return fnObject.apply(self, args);
  }

  return staticWrapper;
}

Immutable.from = Immutable;
Immutable.isImmutable = isImmutable;
Immutable.ImmutableError = ImmutableError;
Immutable.merge = toStatic(merge);
Immutable.replace = toStatic(objectReplace);
Immutable.without = toStatic(without);
Immutable.asMutable = toStaticObjectOrDateOrArray(asMutableObject, asMutableArray, asMutableDate);
Immutable.set = toStaticObjectOrArray(objectSet, arraySet);
Immutable.setIn = toStaticObjectOrArray(objectSetIn, arraySetIn);
Immutable.update = toStatic(update);
Immutable.updateIn = toStatic(updateIn);
Immutable.getIn = toStatic(getIn);
Immutable.flatMap = toStatic(flatMap);
Immutable.asObject = toStatic(asObject);

Object.freeze(Immutable);

export default Immutable;
