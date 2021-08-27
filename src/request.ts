import { URL } from 'url';
import got from 'got';
import { Ok, Err, Result } from 'ts-results';
import { JsonValue } from 'type-fest';
import {
  ConnectionRefusedError,
  isHTTPError,
  isRequestError,
  NotFoundError,
  UnknownError,
} from './errors';

/**
 * Makes a request to a server for JSON data.
 * This function should never reject.
 * @param opts - Connection options to build the URL
 * @param extraPath - Extra path to append to the URL
 */
export async function jsonRequest<T extends JsonValue>(
  opts: AppiumSessionConfig,
  extraPath?: string
): Promise<Result<T, ConnectionRefusedError | NotFoundError | UnknownError>> {
  const url = buildURL(opts, extraPath);

  try {
    return Ok(await got(url).json());
  } catch (err) {
    if (isRequestError(err)) {
      if (err.code === 'ECONNREFUSED') {
        return Err(
          new ConnectionRefusedError(err, `Failed to connect to ${url}`)
        );
      }
    } else if (isHTTPError(err)) {
      if (err.code === '404') {
        return Err(
          new NotFoundError(
            err,
            `Path ${opts.pathname} not found (expected Appium server version ${opts.remoteAppiumVersion}--is it correct?)`
          )
        );
      }
    }
    return Err(new UnknownError(err, `Unknown error: ${String(err)}`));
  }
}

/**
 * Builds a URL from connection options
 */
export function buildURL(
  {
    host,
    port,
    pathname = '',
    protocol,
    username,
    password,
  }: AppiumSessionConfig,
  path?: string
): URL {
  if (path) {
    const pathparts = [...pathname.split('/'), ...path.split('/')];
    pathname = pathparts.join('/');
  }
  const url = new URL(`${protocol}://${host}:${port}${pathname}`);
  if (username && password) {
    url.username = username;
    url.password = password;
  }
  return url;
}
