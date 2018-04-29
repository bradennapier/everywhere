/* eslint global-require: 0, flowtype-errors/show-errors: 0 */
/** @flow */
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @module electron/index
 */
import path from 'path';
import { app, BrowserWindow } from 'electron';
import MenuBuilder from './menu';
import { getContext } from '../internals/utils';

const context = getContext();

let mainWindow = null;

if (context.isProd) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (context.isDev || context.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  // $FlowIgnore
  require('module').globalPaths.push(p);
}

function installExtensions() {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!context.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
  return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload))).catch(console.log);
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even!
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Returns a promise that resolves when setTimeout() completes!
 *
 * @function ms
 * @param {number} time ms until the Promise will resolve
 */
const ms = time => new Promise(resolve => setTimeout(resolve, time));

app.on('ready', async () => {
  await ms(5000);
  const { meta } = context.app;

  if (context.isDev || context.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    title: meta.title,
    show: false,
    width: 1024,
    height: 728,
  });

  mainWindow.webContents.on('crashed', (e, killed) => {
    console.error('Crashed! ', killed);
    console.log(e);
  });

  mainWindow.on('unresponsive', () => {
    console.log('Unresponsvie!');
  });

  mainWindow.loadURL('http://localhost:3000');

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

process.on('uncaughtException', e => {
  console.error('Uncaught Exception! ', e);
});
