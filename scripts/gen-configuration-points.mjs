// this generates contributions.configuration from Appium's options
// it OVERWRITES `package.json` so be careful

import path from 'path';
import {readPackageSync as readPkg} from 'read-pkg';
import {sync as writePkg} from 'write-pkg';
import camelcase from 'camelcase';
import {createRequire} from 'module';

const require = createRequire(import.meta.url);

const TITLE = 'Appium';
const BASE_KEYPATH = Object.freeze(['appium', 'defaults']);
const cwd = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const configuration = {
  title: TITLE,
  properties: {},
};

const pkg = readPkg({cwd});

const OVERRIDES = Object.freeze({
  'appium.defaults.server.callbackPort': {
    markdownDescription:
      'Callback port (default: same as `#appium.defaults.server.port#`)',
  },
  'appium.defaults.server.callbackAddress': {
    markdownDescription:
      'Callback IP address (default: same as `#appium.defaults.server.address#`)',
  },
  'appium.defaults.server.plugins': {
    markdownDescription: 'A list of plugins to activate.',
  },
  'appium.defaults.server.tmp': {
    markdownDescription:
      'Absolute path to directory Appium can use to manage temp files. Defaults to `C:\\Windows\\Temp` on Windows and `/tmp` otherwise.',
  },
  'appium.defaults.server.denyInsecure': {
    markdownDescription:
      "Set which insecure features are not allowed to run in this server's sessions. Features are defined on a driver level; see driver documentation for more details. Features listed here will not be enabled even if also listed in `#appium.defaults.server.allow-insecure#`, and even if `#appium.defaults.server.relaxed-security#` is enabled.",
  },
  'appium.defaults.server.allowInsecure': {
    markdownDescription:
      "Set which insecure features are allowed to run in this server's sessions. Features are defined on a driver level; see driver documentation for more details. Note that features defined via `#appium.defaults.server.deny-insecure#` will be disabled, even if also listed here.",
  },
});

const STATIC_PROPS = Object.freeze({
  'appium.defaults.configFile': {
    markdownDescription: 'Explicit path to Appium config file',
    type: 'string',
  },
  'appium.defaults.server.useAllPlugins': {
    markdownDescription:
      'Enable all installed plugins.  Overrides `#appium.defaults.server.plugins#`.',
    type: 'boolean',
  },
  'appium.appiumHome': {
    markdownDescription: 'Path to `APPIUM_HOME` directory',
    type: 'string',
  },
  'appium.useBundledAppium': {
    markdownDescription: 'Use bundled Appium. If `false`, look for a locally installed Appium or a globally installed Appium',
    type: 'boolean',
    default: true
  }
});

/** 
 * @param {import('ajv').SchemaObject} baseObject - Base schema object
 * @param {string} key - Property name of `baseObject`
 * @param {string[]} [keypath] - Keypath prefix, if any
 */
function transform(baseObject, key, keypath) {
  const {
    minimum,
    maximum,
    type: rawType,
    description,
    format,
    default: defaultValue,
    properties,
    appiumDest,
    items,
    enum: enumValue,
  } = baseObject[key];
  keypath = [...(keypath ?? BASE_KEYPATH), appiumDest ?? camelcase(key)];
  let type;

  type = Array.isArray(rawType)
    ? rawType.find((value) => value !== 'string')
    : rawType;
  const keypathString = keypath.join('.');
  let def = {
    type,
    default: defaultValue,
    description,
    format,
    minimum,
    maximum,
    items,
    enum: enumValue,
    ...(OVERRIDES[keypathString] ?? {}),
  };

  // prefer markdownDescription over description
  if (def.markdownDescription) {
    delete def.description;
  }

  if (type === 'object' && typeof properties === 'object') {
    Object.keys(properties).forEach((key) => {
      transform(properties, key, keypath);
    });
  } else {
    configuration.properties[keypathString] = def;
  }
}

/** @type {import('ajv').SchemaObject} */
const schema = require('appium/build/lib/appium-config.schema.json');
Object.keys(schema.properties).forEach((key) => {
  transform(schema.properties, key);
});

configuration.properties = {...configuration.properties, ...STATIC_PROPS};

pkg.contributes.configuration = configuration;

writePkg(cwd, pkg);
