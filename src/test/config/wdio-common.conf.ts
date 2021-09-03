// More information about teh configuration file can be found here
// https://webdriver.io/docs/configurationfile.html

export const config: WebdriverIO.Config = {
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  // ==================
  // Specify Test Files
  // ==================
  specs: ['./test/specs/login.spec.js', './test/specs/swag.items.list.spec.js'],
  // ============
  // Capabilities
  // ============
  maxInstances: 10,
  capabilities: [],
  // capabilities can be found in the `wdio.saucelabs.conf.js`
  // ===================
  // Test Configurations
  // ===================
  logLevel: 'silent',
  bail: 0,
  baseUrl: 'https://www.saucedemo.com/',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  services: [],
};
