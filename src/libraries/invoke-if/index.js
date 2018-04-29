/* @flow */

// TODO: Type Checking should be able to take the
//       return value of the check fn and provide the
//       inferred type to the invoke fns.
export type $NonFunction = boolean | string | number | { [key: string]: * };

export type InvokeCheck<+A> = (() => A) | A;
export type InvokeFn<A> = (arg: A) => mixed;

export type Invoker<A> =
  | Array<InvokeFn<A> | $NonFunction>
  | (InvokeFn<A> | $NonFunction);

export type ElseInvoker<A> =
  | Array<InvokeFn<A> | $NonFunction>
  | (InvokeFn<A> | $NonFunction);

export type InvokeTest<A> =
  | [InvokeCheck<A>, Invoker<A>]
  | [InvokeCheck<A>, Invoker<A>, ElseInvoker<A>];

export type FactoryFn<A> = () => void | false | null | InvokeTesters<A>;

export type InvokeTesters<A> =
  | Array<InvokeTest<A>>
  | Map<InvokeCheck<A>, Invoker<A>>
  | FactoryFn<A>;

function runTests(_tests) {
  const results = [];

  let tests = _tests;

  while (typeof tests === 'function') {
    tests = tests();
  }

  if (!tests) {
    return results;
  }

  tests = [...tests];

  while (tests.length) {
    // Flow Ignore required as it does not properly
    // handle multiple tuple refinement, although the
    // type itself is sound and it handles it other than
    // throwing the error.
    const nextTest = tests.shift();

    if (!Array.isArray(nextTest)) break;

    let [check, invokes, elseinvokes] = nextTest;

    if (typeof check === 'function') {
      check = check();
    }

    if (check) {
      if (typeof invokes === 'function') {
        results.push(invokes(check));
      } else if (Array.isArray(invokes)) {
        invokes
          .filter(Boolean)
          .forEach(invoke =>
            typeof invoke === 'function'
              ? results.push(invoke(check))
              : results.push(invoke));
      } else if (invokes) {
        results.push(invokes);
      }
    } else if (elseinvokes) {
      if (typeof elseinvokes === 'function') {
        results.push(elseinvokes(check));
      } else if (Array.isArray(elseinvokes)) {
        elseinvokes
          .filter(Boolean)
          .forEach(invoke =>
            typeof invoke === 'function'
              ? results.push(invoke(check))
              : results.push(invoke));
      } else if (elseinvokes) {
        results.push(elseinvokes);
      }
      break;
    } else {
      break;
    }
  }
  return results;
}

function invokeReduce(...tests: Array<InvokeTesters<mixed>>) {
  return tests.reduce((p, c) => p.concat(runTests(c)), []);
}

function invokeMap(...tests: Array<InvokeTesters<mixed>>) {
  return tests.map(test => runTests(test));
}

function invokeAny(...tests: Array<InvokeTest<mixed>>) {
  return tests.reduce((p, c) => p.concat(runTests([c])), []);
}

export default invokeReduce;
export { invokeMap, invokeReduce, invokeAny };
