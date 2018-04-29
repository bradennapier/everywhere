/* @flow */
import config from 'utils/config';

const isLogging: boolean = config(['settings', 'logging']) || false;

const logger = console.groupCollapsed || console.log;

/**
 * utils/log
 *
 */
type LogObj = {
  category?: string,
  level?: 'warn' | 'error' | 'info' | 'log',
  log: string,
};

function log(desc: string | LogObj, ...args: Array<mixed>) {
  if (isLogging) {
    let msg: $PropertyType<LogObj, 'log'>;
    let lvl: $NonMaybeType<$PropertyType<LogObj, 'level'>>;
    let cat: $NonMaybeType<$PropertyType<LogObj, 'category'>>;

    if (typeof desc === 'string') {
      msg = desc;
      lvl = 'log';
      cat = 'LOG';
    } else {
      msg = desc.log;
      lvl = desc.level || 'log';
      cat = desc.category || 'LOG';
    }

    logger(`[${cat}] | ${msg}`);

    if (args.length) {
      args.forEach((v: mixed) => {
        if (Array.isArray(v)) {
          console[lvl](...v);
        } else if (typeof v === 'function') {
          console.dir(v);
        } else {
          console[lvl](v);
        }
      });
    }

    if (console.groupEnd) {
      console.groupEnd();
    }
  }
}

export default log;
