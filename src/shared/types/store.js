/* @flow */
import type { App$InitialState, App$StateDescriptor } from './app';

export type Store$PluginMetaData = {
  id: string,
};

export type Store$PluginSetupFunction = (
  app: App$StateDescriptor,
  ...args: Array<any>
) => Promise<void>;

export type Store$SetupConfig = {|
  compose: Function,
  combineReducers: Function,
  initialState: App$InitialState,

  reducer: void | Function,
  middlewares: Array<*>,
  enhancers: Array<*>,

  hooks: {
    afterCreate: Map<string, Store$PluginSetupFunction>,
    beforeCreate: Map<string, Store$PluginSetupFunction>,
    onReducer: Map<string, Store$PluginSetupFunction>,
  },

  reducers: {
    [reducerID: string]: Function,
  },
|};
