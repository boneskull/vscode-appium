import appiumPkg from 'appium/package.json';
import path from 'path';
import os from 'os';
import { ExtensionMode } from 'vscode';

export const BUNDLED_APPIUM_EXECUTABLE_PATH = require.resolve('appium');
export const OUTPUT_CHANNEL_NAME = 'Appium';
export const BUNDLED_APPIUM_VERSION = appiumPkg.version;
export const DEFAULT_APPIUM_HOME =
  process.env.APPIUM_HOME ?? path.join(os.homedir(), '.appium');
export const APPIUM_SERVER_TASK_TYPE = 'appium-server';

/**
 * Log levels
 */
export enum LOG_LEVEL {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  QUIET,
}

/**
 * Mapping of extension modes to default log level
 */
export const DEFAULT_MODE_LOG_LEVEL = {
  [ExtensionMode.Test]: LOG_LEVEL.DEBUG,
  [ExtensionMode.Development]: LOG_LEVEL.DEBUG,
  [ExtensionMode.Production]: LOG_LEVEL.INFO,
} as const;

export const APPIUM_1_BASEPATH = '/wd/hub';
export const APPIUM_2_BASEPATH = '';

export const SERVER_WRAPPER_PATH = require.resolve('./server-wrapper');
export const DEFAULT_SERVER_FS_PATH = '__DEFAULT__';

export const REQUEST_TIMEOUT = 5000;
