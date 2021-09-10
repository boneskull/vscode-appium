// this generates contributions.configuration from Appium's options
// it OVERWRITES `package.json` so be careful

import path from 'path';
import { readPackageSync as readPkg } from 'read-pkg';
import { sync as writePkg } from 'write-pkg';
import camelcase from 'camelcase';
import { createRequire } from 'module';
import cloner from 'rfdc';

const clone = cloner();

// @ts-ignore
const require = createRequire(import.meta.url);

// const SERVER_DEBUG_CONFIGURATIONS = new Set(['launch']);
const CONFIG_TITLE = 'Appium';
const BASE_CONFIG_KEYPATH = 'appium';

const staticConfigProps = clone(require('./config-static.json'));
const configOverrides = clone(require('./config-overrides.json'));
// const debugProps = clone(require('./debug-static.json'));

// @ts-ignore
const cwd = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const configuration = {
  title: CONFIG_TITLE,
  properties: {},
};

const taskDef = {
  type: 'appium-server',
  properties: {},
};

/**
 * @type {any}
 */
const pkg = readPkg({ cwd, normalize: false });

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
  keypath = [
    ...(keypath ?? [BASE_CONFIG_KEYPATH]),
    renameProperty(appiumDest ?? camelcase(key)),
  ];
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
    ...(configOverrides[keypathString] ?? {}),
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
configuration.properties = {
  ...configuration.properties,
  ...staticConfigProps,
};

Object.keys(configuration.properties).forEach((keystring) => {
  if (keystring.startsWith('appium.serverDefaults')) {
    const leafKeypath = keystring.split('.').slice(-1).shift();
    taskDef.properties[leafKeypath] = configuration.properties[keystring];
    // SERVER_DEBUG_CONFIGURATIONS.forEach(name => {
    //   const attrs = debugProps.configurationAttributes;
    //   if (!attrs[name]) {
    //     attrs[name] = {properties: {}};
    //   }
    //   attrs[name].properties[leafKeypath] = configuration.properties[keystring];
    // });
  }
});

pkg.contributes.configuration = configuration;
pkg.contributes.taskDefinitions = [taskDef];
// pkg.contributes.debuggers = [debugProps];

writePkg(cwd, pkg);
console.error('ok');
