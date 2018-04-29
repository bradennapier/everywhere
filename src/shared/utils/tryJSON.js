/* @flow */
/**
 * tryJSON & tryToJSON
 *  Used to parse JSON strings.  if they fail, they return the
 *  value that was given to them.  No errors will be raised.
 */

export default Object.freeze({
  parse: (str: string) => {
    let r;
    try {
      r = JSON.parse(str);
    } catch (e) {
      return;
    }
    return r;
  },
  stringify: (val: mixed) => {
    let r;
    try {
      r = JSON.stringify(val);
    } catch (e) {
      r = val;
    }
    return r;
  },
});
