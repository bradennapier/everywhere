/* @flow */
export const mutatingObjectMethods = ['setPrototypeOf'];

export const nonMutatingObjectMethods = ['keys'];

export const mutatingArrayMethods = mutatingObjectMethods.concat([
  'push',
  'pop',
  'sort',
  'splice',
  'shift',
  'unshift',
  'reverse',
]);

export const nonMutatingArrayMethods = nonMutatingObjectMethods.concat([
  'map',
  'filter',
  'slice',
  'concat',
  'reduce',
  'reduceRight',
]);

export const mutatingDateMethods = mutatingObjectMethods.concat([
  'setDate',
  'setFullYear',
  'setHours',
  'setMilliseconds',
  'setMinutes',
  'setMonth',
  'setSeconds',
  'setTime',
  'setUTCDate',
  'setUTCFullYear',
  'setUTCHours',
  'setUTCMilliseconds',
  'setUTCMinutes',
  'setUTCMonth',
  'setUTCSeconds',
  'setYear',
]);
