import { Err, Result } from 'ts-results';
import { Uri } from 'vscode';
import {
  APPIUM_1_BASEPATH,
  APPIUM_2_BASEPATH,
  DEFAULT_SERVER_FS_PATH,
} from './constants';
import { RemoteError } from './errors';
import { LocalServer } from './local-server';
import { LoggerService } from './service/logger';
import { RequestService } from './service/request';

export class ServerModel implements AppiumServerInfo {
  private request: RequestService;
  private localServer?: LocalServer;
  public sessions?: AppiumSession[];
  public host?: string;
  public port?: number;
  private _online?: boolean;
  private _build?: AppiumBuild;
  public nickname?: string;
  public protocol?: 'http' | 'https';
  private log = LoggerService.get();
  public readonly uri?: Uri;
  public fsPath: string;
  public pathname: string;
  constructor(config: AppiumSessionConfig, uri?: Uri) {
    this.request = new RequestService(this.log);
    this.uri = uri;
    this.pathname =
      config.pathname ?? config.remoteAppiumVersion === '1.x'
        ? APPIUM_1_BASEPATH
        : APPIUM_2_BASEPATH;
    this.host = config.host;
    this.port = config.port;
    this.protocol = config.protocol;
    this.nickname = config.nickname;
    this.fsPath = uri ? uri.fsPath : DEFAULT_SERVER_FS_PATH;
  }

  get valid(): boolean {
    return Boolean(this.host && this.port && this.protocol);
  }

  get status(): AppiumStatus {
    const status: any = {};
    if (this._build) {
      status.build = this._build;
    }
    if (this._online) {
      status.online = this._online;
    }
    return <AppiumStatus>status;
  }

  get build() {
    return this._build;
  }

  get online() {
    return this._online;
  }

  public async start(config: AppiumLocalServerConfig) {
    this.localServer = new LocalServer(this.log);
    return this.localServer.start(config);
  }

  public async getStatus(): Promise<
    Result<AppiumStatus, RemoteError | ReferenceError>
  > {
    if (this.valid) {
      try {
        const url = this.request.buildURL(this, 'status');
        return (await this.request.json<AppiumStatus>(url))
          .map(({ value: status }) => {
            this.log.info('Retrieved status from %s', url);
            this._build = status.build;
            this._online = true;
            return status;
          })
          .mapErr((err) => {
            this._online = false;
            return err;
          });
      } catch (err) {
        this.log.error(<Error>err);
      }
    }
    this.log.debug(
      'Attempt to get status for invalid server: %s',
      this.nickname ?? this.fsPath
    );
    return Err(
      new ReferenceError(`Invalid server: ${this.nickname ?? this.fsPath}`)
    );
  }

  public update(config: AppiumSessionConfig): ServerModel {
    this.pathname =
      config.pathname ?? config.remoteAppiumVersion === '1.x'
        ? APPIUM_1_BASEPATH
        : APPIUM_2_BASEPATH;
    this.host = config.host;
    this.port = config.port;
    this.protocol = config.protocol;
    this.nickname = config.nickname;

    return this;
  }

  public async getSessions(): Promise<
    Result<AppiumSession[], RemoteError | ReferenceError>
  > {
    if (this.valid) {
      try {
        const url = this.request.buildURL(this, 'sessions');
        return (await this.request.json<AppiumSession[]>(url))
          .map(({ value: sessions }) => {
            this.log.info('Found %d active sessions', sessions.length);
            this.sessions = sessions.map((session) => ({
              serverNickname: this.nickname,
              ...session,
            }));
            this._online = true;
            return sessions;
          })
          .mapErr((err) => {
            this._online = false;
            return err;
          });
      } catch (err) {
        this.log.error(<Error>err);
      }
    }
    this.log.debug(
      'Attempt to get sessions for invalid server: %s',
      this.nickname ?? this.fsPath
    );
    return Err(
      new ReferenceError(`Invalid server: ${this.nickname ?? this.fsPath}`)
    );
  }

  public async getScreenshot(
    id: string
  ): Promise<Result<string, RemoteError | ReferenceError>> {
    if (this.valid) {
      try {
        const result = await this.request.json<string>(this, 'screenshot', id);
        const { url } = result.context;
        return result.map(({ value: screenshot }) => {
          this.log.info(
            'Retrieved base64-encoded screenshot of size %d from %s',
            screenshot.length,
            url
          );
          return screenshot;
        });
      } catch (err) {
        this.log.error(<Error>err);
      }
    }
    this.log.debug(
      'Attempt to get screenshot on invalid server: %s',
      this.nickname ?? this.fsPath
    );
    return Err(
      new ReferenceError(`Invalid server: ${this.nickname ?? this.fsPath}`)
    );
  }
}
