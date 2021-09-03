import path from 'path';
import Mocha from 'mocha';
import fg from 'fast-glob';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    color: true,
  });

  const files = await fg('**/**.spec.js', { cwd: __dirname });

  // Add files to the test suite
  files.forEach((f) => mocha.addFile(path.join(__dirname, f)));

  try {
    // Run the mocha test
    mocha.run((failures) => {
      if (failures > 0) {
        throw new Error(`${failures} tests failed.`);
      }
    });
  } catch (err) {
    throw err;
  }
}
