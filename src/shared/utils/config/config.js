/* @flow */
/**
 * This file contains the overall project configuration which can be used to
 * quickly change the behavior of the application.
 */
import _ from 'lodash';
import Immutable from 'seamless-immutable';

/**
 * @TODO: Need to clean this up more
 */
export type Application$Config = {
  app: {
    title: string,
    version: string
  },

  settings: {
    logging: boolean
  },

  api: {
    ws: {
      [wsAPIName: string]: {
        hostname: string,
        port: number | string,
        pathname: string
      }
    },
    http: {
      [httpAPIName: string]: {
        url: string,
        github?: string
      }
    }
  },

  store: {
    plugins: Array<string>,
    persist: {
      engine: 'redux-persist' | 'legacy',
      name: string,
      description: string,
      encrypted: Array<string>,
      keys: Array<string>
    }
  }
};

const isDev = process.env.NODE_ENV === 'development';

const config: Application$Config = Immutable.from({
  /**
   * Application Metadata and Information
   */
  app: {
    title: 'IDEX Exchange',
    version: '1.0.0',
  },

  settings: {
    logging: isDev,
  },

  api: {
    ws: {},
    http: {
      verifier: {
        url: 'https://idex-verifier.github.io',
        github: 'https://github.com/idex-verifier/idex-verifier.github.io',
      },
    },
  },

  store: {
    // What store plugins should be added?  Each plugin will
    // be dynamically imported so that its dependencies are not
    // required unless used.
    plugins: ['devtools', 'immutable', isDev ? 'logger' : undefined, 'persist', 'router', 'sagas'].filter(Boolean),

    persist: {
      // Change to 'legacy' to use the previous
      // storage system instead.
      // @NOTE:   Migration from previous to new state
      // @TODO:   Should migrate automatically when switching.
      engine: 'redux-persist',

      name: 'storage',
      description: 'IDEX User Storage',

      // Which of the persisted keys should be encrypted before
      // being saved into local storage?
      encrypted: ['privateKey', 'walletPassword'],

      // Which reducer keys should be persisted from the redux store?
      keys: [],
    },
  },
});

// type FirstLevelKeys = $Keys<typeof config>;
//
// type ConfigPaths = [FirstLevelKeys];

function getIDEXApplicationConfig(path: Array<string> | string, def: any) {
  // console.log('Get Config Path: ', path);
  // console.log('Default: ', def);

  // @TODO: Change this so it can be flow typed, will likely be difficult
  return _.get(config, path, def);
}

// getIDEXApplicationConfig(['one']);

// const get = (path: string | Array<string>, def: mixed) =>
//   _.get(config, path, def);

export default getIDEXApplicationConfig;
