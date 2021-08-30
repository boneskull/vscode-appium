import appiumPkg from 'appium/package.json';
import { APPIUM_HOME as appiumHome } from 'appium';
import { ExtensionMode } from 'vscode';

export const BUNDLED_APPIUM_EXECUTABLE_PATH = require.resolve('appium');
export const OUTPUT_CHANNEL_NAME = 'Appium';
export const BUNDLED_APPIUM_VERSION = appiumPkg.version;
export const APPIUM_HOME = appiumHome;
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
