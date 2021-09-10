import got from 'got';
import { Err, Ok, Result } from 'ts-results';
import { JsonObject } from 'type-fest';
import { URL } from 'url';
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
   * Makes a `GET` request to a server for JSON data.
   * This function should never reject.
   * Use {@link RequestService.buildURL} to build the URL.
   * @param url - URL to request
   */
  async json<T>(
    url: URL
  ): Promise<
    Result<
      AppiumResponse<T>,
      ConnectionRefusedError | NotFoundError | UnknownError
    >
  > {
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
          return Err(new NotFoundError(err, `${url} not found!`));
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
    ...path: string[]
  ): URL {
    if (path) {
      const pathparts = [...pathname.split('/'), ...path];
      pathname = pathparts.join('/');
    }
    const url = new URL(`${protocol}://${host}:${port}${pathname}`);
    if (username && password) {
      url.username = username;
      url.password = password;
    }
    return url;
  }

  buildURL = RequestService.buildURL;
}
