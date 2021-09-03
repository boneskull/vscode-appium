import { URL } from 'url';
import got from 'got';
import { Ok, Err, Result } from 'ts-results';
import { JsonObject, JsonValue } from 'type-fest';
import {
  ConnectionRefusedError,
  isHTTPError,
  isRequestError,
  NotFoundError,
  UnknownError,
} from '../errors';
import { LoggerService } from './logger';

interface AppiumResponse<T> extends JsonObject {
  sessionId: null | string;
  status: number;
  value: T;
}

export class RequestService {
  constructor(private log: LoggerService) {}

  /**
   * Makes a request to a server for JSON data.
   * This function should never reject.
   * @param opts - Connection options to build the URL
   * @param extraPath - Extra path to append to the URL
   */
  async json<T>(
    opts: AppiumSessionConfig,
    extraPath?: string
  ): Promise<
    Result<
      AppiumResponse<T>,
      ConnectionRefusedError | NotFoundError | UnknownError
    >
  > {
    const url = RequestService.buildURL(opts, extraPath);

    try {
      const result: AppiumResponse<T> = await got(url).json();
      this.log.debug('Response received: %j', result);
      return Ok(result);
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

  static buildURL(
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
}
