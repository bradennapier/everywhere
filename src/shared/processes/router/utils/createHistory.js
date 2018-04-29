import createHistory from 'history/createBrowserHistory';

const history = createHistory({
  basename: '', // The base URL of the app (see below)
  forceRefresh: false, // Set true to force full page refreshes
  keyLength: 6, // The length of location.key
});

export default history;
