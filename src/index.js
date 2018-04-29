/* @flow */
import React from 'react';
import { Provider } from 'react-redux';
import ReactNative from 'react-native';

// import 'styles/init.global.css';

import TopLevelComponent from './screens/EntryScreen';
import Routing, { Router } from './utilities/routing/index';

const { Route } = Routing;

type AppProps = {
  app: Object
};

class App extends React.Component<AppProps> {
  render() {
    console.log(this);
    const { store } = this.props.app;
    return (
      <Provider store={store}>
        <Router>
          <Route path="/" component={TopLevelComponent} />
        </Router>
      </Provider>
    );
  }
}
/**
 * @description
 * @export
 * @param {any} app
 */
export default function setupApplication(app) {
  const element = document.getElementById('root');
  if (element && app.store) {
    ReactNative.render(<App app={app} />, element);
  }
}
