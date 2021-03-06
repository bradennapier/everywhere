import hoistStatics from 'hoist-non-react-statics';
import { Component, createElement } from 'react';
import { Processes, ProcessSchema } from './context';

/**
 * Connects a Component to a Process to receive its data as props.  This
 * also provides the general Process import functionality that can be
 * called throughout our application.
 * @param  {[type]} selected  [description]
 * @param  {[type]} connector [description]
 * @tutorial example
 * @return {[type]}           [description]
 */
export default function sagaProcessConnector(selected, connector) {
  if (typeof connector === 'function') {
    /*
      The simple method of connecting a component.  This is simple because it
      does not actually render any kind of higher-order component.  Instead,
      it's second argument will receive the selected values and it's return
      value will be returned to the caller.

      const Component = connectProcesses(
        { myProcess: [ 'actions', 'selectors' ] },
        selected => connect(
          ...connect args
        )(Component)
      )
    */
    return connector(getSelectedProcesses(selected));
  } else if (connector === null) {
    /*
      Specifically used to indicate that we simply want to import the values
      and will not be connected them to anything.  Allows for getting values
      dynamically if needed.

      const { actions, selectors } = connectProcesses(
        { myProcess: [ 'actions', 'selectors' ] },
        null
      )
    */
    return getSelectedProcesses(selected);
  }
  /*
      The more standard method of connecting / HOC with other libraries,
      This will return a function that can be passed a valid React Component.
      This version will actually render a component in a similar fashion to the
      way redux-connect operates.

      const Component = connectProcesses(
        {
          myProcess: [ 'action', 'selectors' ]
        }
      )(Component)
    */
  return WrappedComponent => SagaProcessWrapper(WrappedComponent, selected);
}

/**
 * SagaProcessWrapper
 * @param       {[type]} WrappedComponent [description]
 * @param       {[type]} _selected        [description]
 * @constructor
 */
function SagaProcessWrapper(WrappedComponent /* , _selected */) {
  // const selected = getSelectedProcesses(_selected);

  class SagaProcessConnect extends Component {
    addExtraProps = props =>
      // Don't know what we want to do with this style yet
      props;

    render() {
      return createElement(WrappedComponent, this.addExtraProps(this.props));
    }
  }

  SagaProcessConnect.WrappedComponent = WrappedComponent;

  return hoistStatics(SagaProcessConnect, WrappedComponent);
}

/**
 *  sagaProcessGetSelectedProcess
 *  @param {[type]} selected [description]
 */
export const getSelectedProcesses = function sagaProcessGetSelectedProcess(selected) {
  return Object.keys(selected).reduce((...args) => handleProcessReduction(selected, ...args), {});
};

/**
 * handleProcessReduction
 * @param  {[type]} selected [description]
 * @param  {[type]} p        [description]
 * @param  {[type]} c        [description]
 * @return {[type]}          [description]
 */
function handleProcessReduction(selected, p, c) {
  if (!Processes.has(c)) {
    return p;
  }
  const Schema = ProcessSchema.get(Processes.get(c));
  if (!Schema.compiled || !Schema.compiled.public) {
    return p;
  }
  for (const pid of selected[c]) {
    const value = Schema.compiled.public[pid];
    if (value) {
      p[pid] = { ...p[pid], ...value };
    }
  }
  return p;
}
