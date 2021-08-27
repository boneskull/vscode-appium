import path from 'path';
import {compileFromFile} from 'json-schema-to-typescript';
import {writeFile} from 'fs/promises';
import {createRequire} from 'module';
import { URL } from 'url'; // in Browser, the URL in native accessible on window

// const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
//@ts-ignore
const __dirname = new URL('.', import.meta.url).pathname;

// @ts-ignore
const require = createRequire(import.meta.url);

const SCHEMA_PATH = require.resolve(
  'appium/build/lib/appium-config.schema.json'
);

const DECLARATIONS_PATH = path.join(
  __dirname,
  '..',
  'types',
  'appium-config.d.ts',
);

async function main () {
  try {
    const ts = await compileFromFile(SCHEMA_PATH);
    await writeFile(DECLARATIONS_PATH, ts);
    console.log(`wrote to ${DECLARATIONS_PATH}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();
