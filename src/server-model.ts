import { Result } from 'ts-results';
import { APPIUM_1_BASEPATH, APPIUM_2_BASEPATH } from './constants';
import { RemoteError } from './errors';
import { LocalServer } from './local-server';
import { LoggerService } from './service/logger';
import { RequestService } from './service/request';

export class ServerModel {
  private request: RequestService;
  private localServer?: LocalServer;
  public readonly id: string;
  private sessions?: AppiumSession[];
  public readonly host: string;
  public readonly port: number;
  private _online?: boolean;
  private _build?: AppiumBuild;
  public readonly nickname: string;
  public readonly protocol: 'http' | 'https';

  constructor(
    protected log: LoggerService,
    public config: AppiumSessionConfig
  ) {
    this.request = new RequestService(log);

    this.config.pathname =
      this.config.pathname ?? this.config.remoteAppiumVersion === '1.x'
        ? APPIUM_1_BASEPATH
        : APPIUM_2_BASEPATH;

    this.id = `${this.config.host}:${this.config.port}`;
    this.host = this.config.host;
    this.port = this.config.port;
    this.nickname = this.config.nickname ?? this.id;
    this.protocol = this.config.protocol;
  }

  get build() {
    return this._build;
  }

  get online() {
    return this._online;
  }

  public getInfo(): AppiumServerInfo {
    return {
      host: this.host,
      port: this.port,
      sessions: this.sessions,
      status: {
        build: this.build,
        online: this.online,
      },
      nickname: this.nickname,
      protocol: this.protocol,
    };
  }

  public async start(config: AppiumLocalServerConfig) {
    this.localServer = new LocalServer(this.log);
    return this.localServer.start(config);
  }

  public async getStatus(): Promise<Result<AppiumStatus, RemoteError>> {
    const url = this.request.buildURL(this.config, 'status');
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
  }

  public async getSessions(): Promise<Result<AppiumSession[], RemoteError>> {
    const url = this.request.buildURL(this.config, 'sessions');
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
  }

  public async getScreenshot(id: string): Promise<Result<string, RemoteError>> {
    const result = await this.request.json<string>(
      this.config,
      'screenshot',
      id
    );
    const { url } = result.context;
    return result.map(({ value: screenshot }) => {
      this.log.info(
        'Retrieved base64-encoded screenshot of size %d from %s',
        screenshot.length,
        url
      );
      return screenshot;
    });
  }
}
