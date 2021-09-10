import got, { OptionsOfJSONResponseBody } from 'got';
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

type RequestError = ConnectionRefusedError | NotFoundError | UnknownError;

interface AppiumResponse<T> extends JsonObject {
  sessionId: null | string;
  status: number;
  value: T;
}

type AppiumRequestResult<T> = AppiumResult<
  AppiumResponse<T>,
  RequestError,
  { url: URL }
>;

export class RequestService {
  constructor(private log: LoggerService) {}

  /**
   * Makes a `GET` request to a server for JSON data.
   * This function should never reject.
   * Use {@link RequestService.buildURL} to build the URL.
   * @param url - URL to request
   */
  async json<T>(
    server: AppiumSessionConfig,
    endpoint: string,
    sessionId?: string
  ): Promise<AppiumRequestResult<T>>;
  async json<T>(
    url: URL,
    opts?: OptionsOfJSONResponseBody
  ): Promise<AppiumRequestResult<T>>;
  async json<T>(
    urlOrServer: URL | AppiumSessionConfig,
    optsOrEndpoint?: OptionsOfJSONResponseBody | string,
    sessionId?: string
  ): Promise<AppiumRequestResult<T>> {
    let url: URL;
    let opts: OptionsOfJSONResponseBody;
    if (urlOrServer instanceof URL) {
      url = urlOrServer;
      opts = <OptionsOfJSONResponseBody>optsOrEndpoint;
    } else {
      const serverInfo = urlOrServer;
      const endpoint = <string>optsOrEndpoint;
      const pathParts = sessionId
        ? ['session', sessionId, endpoint]
        : [endpoint];
      url = RequestService.buildURL(serverInfo, ...pathParts);
      opts = {};
    }
    const handleError = RequestService.createErrorHandler(url);
    const result = await Result.wrapAsync<AppiumResponse<T>, RequestError>(() =>
      got(url, opts).json()
    );

    return <AppiumRequestResult<T>>(
      Object.assign(result.mapErr(handleError), { context: { url } })
    );
  }

  private static createErrorHandler(url: URL) {
    return (err: unknown): RequestError => {
      if (isRequestError(err)) {
        if (err.code === 'ECONNREFUSED') {
          return new ConnectionRefusedError(err, `Failed to connect to ${url}`);
        }
      } else if (isHTTPError(err)) {
        if (err.code === '404') {
          return new NotFoundError(err, `${url} not found!`);
        }
      }
      return new UnknownError(err, `Unknown error: ${String(err)}`);
    };
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
