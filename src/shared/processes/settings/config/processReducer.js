import Immutable from 'seamless-immutable';
import _ from 'lodash';

const SettingsProcessReducer = {
  settingsMergeSettings: (state, action) => {
    if (!action.settings) return state;
    if (action.path) {
      let path;
      if (typeof action.path === 'string') {
        path = _.toPath(action.path);
      } else {
        // eslint-disable-next-line
        path = action.path;
      }
      return Immutable.setIn(
        state,
        path,
        Immutable.merge(Immutable.getIn(state, path), action.settings, {
          deep: true,
        }),
        { deep: true },
      );
    }
    return Immutable.merge(state, action.settings, { deep: true });
  },
  settingsSetSettings: (state, action) => {
    if (!action.path) return state;
    let path;
    if (typeof action.path === 'string') {
      path = _.toPath(action.path);
    } else {
      // eslint-disable-next-line
      path = action.path;
    }
    return Immutable.setIn(state, path, action.value, { deep: true });
  },
  settingsRemoveSettings: (state, action) => {
    if (!action.path) return state;
    let path;
    if (typeof action.path === 'string') {
      path = _.toPath(action.path);
    } else {
      // eslint-disable-next-line
      path = action.path;
    }
    const removeKey = path.pop();

    const previousSettings = Immutable.getIn(state, path);

    const nextSettings = Immutable.without(previousSettings, removeKey);

    return Immutable.setIn(state, path, nextSettings);
  },
  settingsReplaceSettings: (state, action) =>
    Immutable.replace(state, action.settings),
};

export default SettingsProcessReducer;
