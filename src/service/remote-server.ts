import { Err, Ok, Result } from 'ts-results';
import { Disposable, EventEmitter } from 'vscode';
import { RemoteServer } from '../remote-server';
import { ConfigService } from './config';
import { LoggerService } from './logger';

export interface ServerWatcher extends Disposable {
  info: AppiumServerInfo;
}

type AppiumServerInfoEmitter = EventEmitter<AppiumServerInfo>;

/**
 * Communicates with one or more Appium servers.
 * Will be a singleton. Must be created via {@link RemoteServerService.get}.
 */
export class RemoteServerService implements Disposable {
  private updateEmitter: AppiumServerInfoEmitter = new EventEmitter();
  private disposables: Disposable[];
  private lastRequestStatus?: Ok<any> | Err<any>;
  private pollers: Map<RemoteServer, NodeJS.Timeout> = new Map();

  public readonly onDidUpdateServer = this.updateEmitter.event;

  private constructor(
    private log: LoggerService,
    private config: ConfigService
  ) {
    this.watch(this.config.get('sessionDefaults'));

    // this can be initialized in the class body but I am using an obnoxious
    // extension which puts this _before_ `this.updateEmitter` is declared,
    // which fails because class bodies ain't scoped that way.
    this.disposables = [this.updateEmitter];

    // todo watch all known servers
  }

  public static get(
    log: LoggerService,
    config: ConfigService
  ): RemoteServerService {
    if (remoteServerService) {
      return remoteServerService;
    }
    return new RemoteServerService(log, config);
  }

  public dispose() {
    this.pollers.forEach((timeout) => {
      clearInterval(timeout);
    });
    this.pollers.clear();
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
  }

  /**
   * Periodically poll a server for status and session data.
   * Will do its initial poll "soon" after this function returns, and then
   * every `pollInterval` ms thereafter (roughly).
   * @todo get this refresh ms value from config
   * @param config - Configuration of server to poll
   * @param refreshMS - Milliseconds to wait between polls
   * @returns A disposable that stops polling.
   */
  public watch(config: AppiumSessionConfig, refreshMS = 10000): ServerWatcher {
    const server = new RemoteServer(this.log, config);
    setTimeout(async () => {
      await this.poll(server);
      this.pollers.set(
        server,
        setInterval(() => this.poll(server), refreshMS)
      );
    });
    return {
      info: server.getInfo(),
      dispose: () => {
        const timeout = this.pollers.get(server);
        if (timeout !== undefined) {
          clearInterval(timeout);
        }
        return this.pollers.delete(server) && timeout !== undefined;
      },
    };
  }

  private async poll(server: RemoteServer) {
    const [statusResult, sessionsResult] = await Promise.all([
      server.getStatus(),
      server.getSessions(),
    ]);

    const info = server.getInfo();
    this.updateEmitter.fire(info);

    this.lastRequestStatus = Result.all(statusResult, sessionsResult)
      .mapErr((err) => {
        this.log.info('Server "%s" is offline', server.nickname);
        this.log.debug(err.message);
      })
      .map(() => {
        if (this.lastRequestStatus?.err) {
          this.log.info('Server "%s" came online', server.nickname);
        }
      });
  }
}

/**
 * Lazily-created singleton instance of {@link RemoteServerService}
 */
export let remoteServerService: RemoteServerService;
