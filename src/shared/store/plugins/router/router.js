import { routerMiddleware as createRouterMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';

async function loadRouterStorePlugin(app) {
  const history = createHistory();
  // Create the Router Middleware and give it our history object.
  const routerMiddleware = createRouterMiddleware(history);
  // Add the Router Middleware to our store
  app.config.middlewares.push(routerMiddleware);
}

export default loadRouterStorePlugin;
