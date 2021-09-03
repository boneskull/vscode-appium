import { Ok, Result } from 'ts-results';
import { APPIUM_1_BASEPATH, APPIUM_2_BASEPATH } from './constants';
import { ConnectionRefusedError, NotFoundError, UnknownError } from './errors';
import { LoggerService } from './service/logger';
import { RequestService } from './service/request';

type RemoteError = ConnectionRefusedError | NotFoundError | UnknownError;

export interface AppiumSession {
  id: string;
  capabilities: Record<string, any>;
}

export interface AppiumServerBuild {
  version: string;
  'git-sha': string;
  built: string;
}

export interface AppiumStatus {
  build: AppiumServerBuild;
}

export class AppiumServer {
  private request: RequestService;

  constructor(
    protected log: LoggerService,
    public config: AppiumSessionConfig
  ) {
    this.request = new RequestService(log);

    this.config.pathname =
      this.config.pathname ?? this.config.remoteAppiumVersion === '1.x'
        ? APPIUM_1_BASEPATH
        : APPIUM_2_BASEPATH;
  }

  public async getStatus(): Promise<Result<AppiumStatus, RemoteError>> {
    const result = await this.request.json<AppiumStatus>(this.config, 'status');
    return result.ok ? Ok(result.val.value) : result;
  }

  public async getSessions(): Promise<Result<Set<AppiumSession>, RemoteError>> {
    const result = await this.request.json<AppiumSession[]>(
      this.config,
      'sessions'
    );
    if (result.ok) {
      this.log.info('Found %d active sessions', result.val.value.length);
      return Ok(new Set(result.val.value));
    }
    return result;
  }
}
