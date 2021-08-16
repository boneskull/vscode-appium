import appiumPkg from 'appium/package.json';

export const BUNDLED_APPIUM_EXECUTABLE_PATH = require.resolve('appium');
export const OUTPUT_CHANNEL_NAME = 'Appium';
export const BUNDLED_APPIUM_VERSION = appiumPkg.version;
