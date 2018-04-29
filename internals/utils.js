/* @flow */
import path from 'path';
import notifier from 'node-notifier';
import chalk from 'chalk';
import RootDir from 'app-root-dir';
import pkg from '../package.json';
import app from '../app.json';

type $Platforms = 'ios' | 'android' | 'web' | 'electron';
type $DeviceTypes = 'desktop' | 'mobile';

export type $Context = {|
  isPlatform: $Platforms,
  isDeviceType: $DeviceTypes,
  isDev: boolean,
  isProd: boolean,
  isStage: string,
  package: $PackageJSON,
  env: { [environmentVariable: string]: ?string },
  app: {
    meta: {
      slug: string,
      title: string
    },
    build: {
      packager: string
    }
  },
  dirs: {
    [directory: string]: () => string
  },
  files: {
    [file: string]: () => string
  }
|};

const rootDir = RootDir.get();

let context: $Context;

export function getContext(ctx = {}): $Context {
  const { env } = process || {};
  context = {
    isPlatform: ctx.platform || 'web',
    isDeviceType: ctx.platform === 'android' || ctx.platform === 'ios' ? 'mobile' : 'desktop',
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isStage: env.NODE_ENV || 'development',
    package: pkg,
    dirs: {
      root: () => rootDir,
      dll: () => path.resolve(rootDir, 'dll'),
      ui: () => path.resolve(rootDir, 'ui'),
      dist: () => path.resolve(context.dirs.root(), 'dist'),
      public: () => path.resolve(context.dirs.root(), 'public'),
      modules: () => path.resolve(rootDir, 'node_modules'),
    },
    files: {
      main: () => path.resolve(context.dirs.ui(), 'main.js'),
      template: () => path.resolve(context.dirs.ui(), 'index.ejs'),
      manifest: () => path.resolve(context.dirs.dll(), '[name].json'),
      yarnLock: () => path.resolve(context.dirs.root(), 'yarn.lock'),
      appHTML: () => path.resolve(context.dirs.public(), 'index.html'),
    },
    env,
    app,
  };
  return context;
}

// export function ifPlatform(isplat: {| [platformID: $Platforms]: Object |}) {
//   if (!context) {
//     throw new Error('Context is Not Defined, you must first call getContext()');
//   }
//   const platform = context.isPlatform;
//   switch (platform) {
//   }
// }

export function log(options = {}, ...args) {
  const { level = 'info', notify, message } = options;

  const title = `${options.title || 'IDEX NOTIFICATION'.toUpperCase()}`;

  if (notify) {
    notifier.notify({
      title,
      message: options.message,
    });
  }

  const msg = `\n[${level.toUpperCase()}] ==> ${title} -> ${message}\n`;

  switch (level) {
    case 'none':
      return console.log(msg, ...args);
    case 'warn':
      return console.log(chalk.black.bgYellow.bold(msg), ...args);
    case 'error':
      return console.log(chalk.bgRed.white(msg), ...args);
    case 'info':
    default:
      return console.log(chalk.green(msg), ...args);
  }
}
