import { Err, Ok, Result } from 'ts-results';
import { Disposable, EventEmitter } from 'vscode';
import { ServerModel } from '../server-model';
import { LoggerService } from './logger';
import { deepEqual } from 'fast-equals';

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
  private pollers: Map<ServerModel, NodeJS.Timeout> = new Map();

  public readonly onDidUpdateServer = this.updateEmitter.event;
  private log: LoggerService = LoggerService.get();
  private constructor() {
    // this can be initialized in the class body but I am using an obnoxious
    // ts "organization" extension which puts this _before_ `this.updateEmitter` is declared,
    // which fails because class bodies ain't scoped that way.
    this.disposables = [this.updateEmitter];

    // todo watch all known servers
  }

  public static get(): RemoteServerService {
    if (remoteServerService) {
      return remoteServerService;
    }
    return new RemoteServerService();
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
   * @param server - RemoteServer instance
   * @param refreshMS - Milliseconds to wait between polls
   * @returns A disposable that stops polling.
   */
  public watch(server: ServerModel, refreshMS = 10000): ServerWatcher {
    if (!server.valid) {
      throw new ReferenceError(
        'Cannot watch server without a host, port, and protocol'
      );
    }
    this.log.debug('Watching server "%s"', server.nickname ?? server.fsPath);

    setTimeout(async () => {
      await this.poll(server);
      this.pollers.set(
        server,
        setInterval(async () => {
          await this.poll(server);
        }, refreshMS)
      );
    });
    return {
      info: server,
      dispose: () => {
        const timeout = this.pollers.get(server);
        if (timeout !== undefined) {
          clearInterval(timeout);
        }
        this.log.debug(
          'Canceled poll for server %s',
          server.nickname ?? server.fsPath
        );
        return this.pollers.delete(server) && timeout !== undefined;
      },
    };
  }

  private async poll(server: ServerModel) {
    this.log.debug('Polling server "%s"', server.nickname ?? server.fsPath);
    try {
      const status = { ...server.status };
      const sessions = [...(server.sessions ?? [])];
      const [statusResult, sessionsResult] = await Promise.all([
        server.getStatus(),
        server.getSessions(),
      ]);

      if (
        !deepEqual(status, server.status) ||
        !deepEqual(sessions, server.sessions)
      ) {
        this.updateEmitter.fire(server);
      }

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
    } catch (err) {
      this.log.error(<Error>err);
    }
  }
}

/**
 * Lazily-created singleton instance of {@link RemoteServerService}
 */
export let remoteServerService: RemoteServerService;
