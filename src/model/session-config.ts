import {URL} from 'url';
import {major} from 'semver';
import {instanceOfNodeError} from '../errors';

interface Capabilities {
  [key: string]: string;
}

interface SessionConfigOptions {
  hostname: string;
  port: number | string;
  pathname: string;
  enableSSL: boolean;
  allowUnauthorizedCertificates: boolean;
  enableProxy: boolean;
  proxyURL: string | URL;
  capabilities: Capabilities;
  appiumVersion: string;
  plainTextUsername: string;
  plainTextPassword: string;
  queryString: string;
  url: string | URL;
}

export class SessionConfig {
  allowUnauthorizedCertificates = false;
  private url?: URL;
  private _proxyURL?: URL;
  capabilities?: Capabilities;

  static readonly DEFAULT_HOSTNAME = '127.0.0.1';
  static readonly DEFAULT_PORT = '4723';

  constructor(opts: Partial<SessionConfigOptions>) {
    this.allowUnauthorizedCertificates =
      opts.allowUnauthorizedCertificates ?? this.allowUnauthorizedCertificates;
    this.proxyURL = opts.proxyURL ?? this.proxyURL;
    this.capabilities = opts.capabilities ?? this.capabilities;

    const pathname =
      opts.appiumVersion && major(opts.appiumVersion) < 2
        ? opts.pathname ?? '/wd/hub'
        : opts.pathname ?? '/';
    const hostname = opts.hostname ?? SessionConfig.DEFAULT_HOSTNAME;
    const scheme = opts.enableSSL ? 'https' : 'http';
    const port = opts.port ?? SessionConfig.DEFAULT_PORT;

    this.url = SessionConfig.createURL(
      opts.url ?? `${scheme}://${hostname}:${port}${pathname}`,
      {
        username: opts.plainTextUsername,
        password: opts.plainTextPassword,
        search: opts.queryString,
      },
    );
  }

  protected static create(opts: SessionConfigOptions) {
    return new SessionConfig(opts);
  }

  get proxyURL() {
    return this._proxyURL?.toString() ?? '';
  }

  set proxyURL(value: string | URL) {
    this._proxyURL = value
      ? SessionConfig.createURL(value.toString())
      : undefined;
  }

  private static createURL(value: string | URL, props: Partial<URL> = {}) {
    try {
      const url = new URL(value.toString());
      Object.assign(url, props);
      return url;
    } catch (err) {
      if (
        instanceOfNodeError(err, TypeError) &&
        err.code === 'ERR_INVALID_URL'
      ) {
        throw new TypeError(`"${value}" is not a valid URL!`);
      }
      throw err;
    }
  }
}
