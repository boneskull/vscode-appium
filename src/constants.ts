import appiumPkg from 'appium/package.json';
import { APPIUM_HOME as appiumHome } from 'appium';

export const BUNDLED_APPIUM_EXECUTABLE_PATH = require.resolve('appium');
export const OUTPUT_CHANNEL_NAME = 'Appium';
export const BUNDLED_APPIUM_VERSION = appiumPkg.version;
export const APPIUM_HOME = appiumHome;
export const APPIUM_SERVER_TASK_TYPE = 'appium-server';
