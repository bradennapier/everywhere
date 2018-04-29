import { createSelector } from 'reselect';

import {
  settingsStateSelector,
  withSettingsSelector,
} from 'selectors/settings';

const processSelectors = {};

processSelectors.settings = createSelector(
  settingsStateSelector,
  settings => settings,
);

processSelectors.withSettings = withSettingsSelector;

export default processSelectors;
