import Immutable from 'seamless-immutable';
import { Process } from 'redux-saga-process';
import { call, put, fork, select } from 'redux-saga/effects';

import { createSelector } from 'reselect';

import queryString from 'query-string';

import { createTaskManager } from 'saga-task-manager';

// import startRouteObserver from './observers/routeObserver';
import { push, go } from 'react-router-redux';

const buildConfig = config => ({
  reduces: 'router',
  pid: 'router',
  log: false,
  ...config,
});

/*
  Router Notes & Information

  URL Queries:
    URL Queries are monitored and handled by reading them, adding them to state,
    then deleting them (replace) from the url path.  Other processes will monitor
    if they have a query that they handle.

    Once a specific query has been handled, it can be removed from the queue by
    dispatching ROUTER_QUERY_HANDLED with either the key in "query" ({ query: 'myQuery' })
    or an array of queries ({ queries; ['myQuery'] }).
*/
const processReducer = {
  routerChanged: (state, action) =>
    Immutable.set(state, 'location', action.location),
  routerQueries: (state, action) =>
    Immutable.merge(state, { queries: action.queries }, { deep: true }),
  routerQueryHandled: (state, action) =>
    Immutable.without(
      state,
      ['queries', action.query],
      ...(Array.isArray(action.queries) &&
        action.queries.map(query => ['query', query])),
    ),
};

const processActionRoutes = {
  routerSet: 'handleSetRoute',
};

const processActionCreators = {
  routerSet: ['path', 'state', 'clearScreen'],
  routerQueryHandled: null,
};

export default function configureRouterProcess(_config) {
  const config = buildConfig(_config);

  const processSelectors = {};

  const stateKeySelector = state => state[config.reduces];

  processSelectors.routerLocation = createSelector(
    stateKeySelector,
    router => router.location,
  );

  processSelectors.routerQueries = createSelector(
    stateKeySelector,
    router => router.queries,
  );

  const processConfig = {
    pid: config.pid,
    reduces: config.reduces,
  };

  class RouterProcess extends Process {
    constructor(processID, state, proc) {
      super(processID, state, proc);
      // console.log('Process Constructs: ', state)
      this.processID = processID;
      this.state = {
        history: undefined,
        ...state,
      };
      this.task = createTaskManager(this.processID, {
        name: 'ROUTER',
        log: config.log,
        icon: '🚀',
      });
      this.handlers = {
        onEvent: [this, this.handleRouteChange],
      };
    }

    * handleRouteChange(location, action) {
      console.log('Route Change: ', action, location);
      this.state.history.location = location;
      yield call([this, this.dispatchCurrentRoute]);
    }

    * dispatchCurrentRoute() {
      const { location } = this.state.history;
      // console.log(this.history)
      if (location.search) {
        yield fork([this, this.parseQueryString]);
      }
      yield put({
        type: 'ROUTER_CHANGED',
        location,
      });
    }

    * parseQueryString() {
      const { location } = this.state.history;
      if (location.search) {
        const queries = queryString.parse(location.search);
        this.state.history.replace(location.pathname);
        yield put({
          type: 'ROUTER_QUERIES',
          queries,
        });
      }
    }

    * handleSetRoute({ path, state, clearScreen = true }) {
      if (!path) {
        console.warn(
          '[router-process]: Attempted to Navigate to Empty Path!',
          state,
        );
        return;
      } else if (typeof path === 'number') {
        yield put(go(path));
      } else {
        const location = yield select(processSelectors.routerLocation);
        // check if this changes the actual path
        if (location && location.pathname === path) {
          return;
        }
        yield put(push(path, state));
        // TODO: This is hacky - make this nicer
        if (path === '/dashboard') {
          yield put({
            type: 'SET_PAGE_TITLE',
            title: ['Dashboard'],
          });
          yield put({
            type: 'SELECTED_PROJECT',
          });
        }
      }
      if (clearScreen) {
        yield put({
          type: 'KEY_ESCAPE',
        });
      }
    }

    * processStarts() {
      if (this.state.history) {
        yield call([this, this.handleRouterStartup], {
          history: this.state.history,
        });
      }
    }
  }

  return {
    process: RouterProcess,
    config: processConfig,
    selectors: processSelectors,
    actionCreators: processActionCreators,
    actionRoutes: processActionRoutes,
    reducer: processReducer,
  };
}
