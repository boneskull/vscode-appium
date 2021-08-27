// this generates contributions.configuration from Appium's options
// it OVERWRITES `package.json` so be careful

import path from 'path';
import {readPackageSync as readPkg} from 'read-pkg';
import {sync as writePkg} from 'write-pkg';
import camelcase from 'camelcase';
import {createRequire} from 'module';
import {APPIUM_SERVER_TASK_TYPE} from '../out/constants.js';

// @ts-ignore
const require = createRequire(import.meta.url);

const STATIC_CONFIG_PROPS = Object.freeze(require('./config-static.json'));
const CONFIG_OVERRIDES = Object.freeze(require('./config-overrides.json'));
const CONFIG_TITLE = 'Appium';
const BASE_CONFIG_KEYPATH = Object.freeze(['appium']);

// @ts-ignore
const cwd = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const configuration = {
  title: CONFIG_TITLE,
  properties: {},
};

const taskDef = {
  type: APPIUM_SERVER_TASK_TYPE,
  properties: {}
};

const pkg = readPkg({cwd});

/**
 * Given a property name `property`, rename it if needed.
 * @param {string} property
 */
function renameProperty(property) {
  return property === 'server' ? 'serverDefaults' : property;
}

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
  keypath = [...(keypath ?? BASE_CONFIG_KEYPATH), renameProperty(appiumDest ?? camelcase(key))];
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
    ...(CONFIG_OVERRIDES[keypathString] ?? {}),
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

const schema = require('appium/build/lib/appium-config-schema').default;
console.error('Found Appium schema; transforming');
Object.keys(schema.properties).forEach((key) => {
  transform(schema.properties, key);
});
configuration.properties = {...configuration.properties, ...STATIC_CONFIG_PROPS};

Object.keys(configuration.properties).forEach(keystring => {
  if (keystring.startsWith('appium.serverDefaults')) {
    const baseKeypath = keystring.split('.').slice(-1);
    taskDef.properties[baseKeypath] = configuration.properties[keystring];
  }    
});

pkg.contributes.configuration = configuration;
pkg.contributes.taskDefinitions = [taskDef];

writePkg(cwd, pkg);
console.error('ok');
