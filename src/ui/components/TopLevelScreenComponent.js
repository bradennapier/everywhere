import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

// This is a dumb component that is common for native and web

class TopLevelScreenComponent extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      message: 'Welcome to top level component of this app.',
      dispatchMessage: 'Dispatch an action to:',
      passActionDispatchValue: 1,
      failActionDispatchValue: 0,
    };
  }

  render() {
    console.log(this);
    return (
      <View style={styles.wrapper}>
        <Text style={styles.biggerText}>Bank</Text>
        <View style={styles.row}>
          <Text style={styles.text}>{this.state.dispatchMessage}</Text>
          <View style={styles.button}>
            <Button title={'Pass!'} onPress={this.props.passDispatchedAction} />
          </View>
          <View style={styles.button}>
            <Button title={'Fail'} onPress={this.props.failDispatchedAction} />
          </View>
        </View>
        <Text style={styles.biggerText}>{this.props.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    color: 'black',
    display: 'flex',
    flex: 1,
    height: '100vh',
  },
  row: {
    flexDirection: 'row',
    margin: 5,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biggerText: {
    fontSize: 17,
    alignSelf: 'center',
  },
  button: {
    margin: 5,
  },
});

export default TopLevelScreenComponent;
