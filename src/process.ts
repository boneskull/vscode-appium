import { node as fork, ExecaChildProcess } from 'execa';
import { Disposable } from 'vscode';
import { DEFAULT_APPIUM_HOME, SERVER_WRAPPER_PATH } from './constants';
import { LoggerService } from './service/logger';

export class AppiumProcess implements Disposable {
  private proc?: ExecaChildProcess;

  private constructor(
    private log: LoggerService,
    private executable: AppiumExecutable,
    private config: Partial<AppiumLocalServerConfig>
  ) {}

  public static create(
    log: LoggerService,
    executable: AppiumExecutable,
    config: Partial<AppiumLocalServerConfig>
  ) {
    const appium = new AppiumProcess(log, executable, config);
    return appium.activate();
  }

  public activate(): AppiumProcess {
    this.log.info('Spawning Appium...');
    if (this.proc) {
      this.log.debug('Found running proc %O', this.proc);
      return this;
    }

    try {
      const appium = (this.proc = this.exec(
        this.executable.path,
        this.config.appiumHome
      ));
      appium
        .on('message', (message: AppiumIPCMessage) => {
          switch (message.type) {
            case 'ready':
              this.log.debug('subprocess ready');
              this.sendCommand('start', {
                args: this.config,
              });
              break;
            case 'fail':
              this.log.info('subprocess failed. reason: %s', message.reason);
              // todo notification
              break;
            case 'started':
              const { details } = message;
              this.log.info(
                'Appium server running on %s:%s',
                details.address,
                details.port
              );
              break;
          }
        })
        .on('error', (err) => {
          this.log.error(err);
        })
        .on('close', () => {
          this.log.debug('subprocess closed');
        });
    } catch (err) {
      this.log.error(String(err));
      return this;
    }

    return this;
  }

  public dispose() {
    this.kill();
  }

  public kill() {
    this.proc?.kill('SIGINT');
  }

  public onData(listener: AppiumProcessDataListener): AppiumProcess {
    this.proc?.stderr?.on('data', (data: Buffer) => {
      if (this.proc) {
        listener.call(this.proc, data.toString());
      }
    });
    this.proc?.stdout?.on('data', (data: Buffer) => {
      if (this.proc) {
        listener.call(this.proc, data.toString());
      }
    });
    return this;
  }

  /**
   * Forks `appium`
   * @param executablePath - Path to Appium executable
   * @param appiumHome - Path to `APPIUM_HOME`
   * @returns Appium child process
   */
  private exec(
    executablePath: AppiumExecutable['path'],
    appiumHome: string = DEFAULT_APPIUM_HOME
  ): ExecaChildProcess {
    this.log.info('APPIUM_HOME = %s', appiumHome);
    this.log.info(
      'Using command: node %s %s',
      SERVER_WRAPPER_PATH,
      executablePath
    );

    return fork(SERVER_WRAPPER_PATH, [executablePath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { APPIUM_HOME: appiumHome },
    });
  }

  private sendCommand(command: AppiumIPCCommand['command'], ...extra: any[]) {
    if (!this.proc || !this.proc.connected) {
      throw new ReferenceError('appium process not running');
    }
    // unsure of how to type this, so it's whatever it is.
    const msg = Object.assign({ type: 'command', command }, ...extra);
    this.log.debug('Sending command: %O', msg);
    this.proc.send(msg);
  }
}

type AppiumProcessDataListener = (
  this: ExecaChildProcess,
  data: string
) => void;
