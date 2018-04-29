import React from 'react';
import { connect } from 'react-redux';

import { StyleSheet, View } from 'react-native';

import TopLevelScreenComponent from './../components/TopLevelScreenComponent';

class EntryScreen extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      message: 'Welcome to top level component of this app.',
      dispatchMessage: 'Dispatch an action to:',
      passActionDispatchValue: 1,
      failActionDispatchValue: 0,
    };
    this.passDispatchedAction = this.passDispatchedAction.bind(this);
    this.failDispatchedAction = this.failDispatchedAction.bind(this);
  }

  passDispatchedAction() {
    this.props.dispatch({ type: 'PASS' });
  }

  failDispatchedAction() {
    this.props.dispatch({ type: 'FAIL' });
  }

  render() {
    return (
      <View style={styles.container}>
        <TopLevelScreenComponent />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#303641',
  },
});

function mapStateToProps(state) {
  return {
    sampleReducer: state.sampleReducer || {},
  };
}

export default connect(mapStateToProps)(EntryScreen);
