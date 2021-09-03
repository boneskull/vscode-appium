import { APPIUM_HOME } from 'appium';
import { node as fork, ExecaChildProcess } from 'execa';
import { Disposable } from 'vscode';
import { LoggerService } from './service/logger';

export class AppiumProcess implements Disposable {
  private proc?: ExecaChildProcess;

  private constructor(
    private log: LoggerService,
    private executable: AppiumExecutable,
    private config: AppiumServerConfig
  ) {}

  public static create(
    log: LoggerService,
    executable: AppiumExecutable,
    config: AppiumServerConfig
  ) {
    const appium = new AppiumProcess(log, executable, config);
    return appium.activate();
  }

  public activate(): AppiumProcess {
    if (this.proc) {
      return this;
    }

    const appiumHome: string = this.config.appiumHome ?? APPIUM_HOME;

    this.log.info(
      'Using command: node %s %s',
      require.resolve('./appium-wrapper'),
      this.executable.path
    );

    const appium = (this.proc = fork(
      require.resolve('./appium-wrapper'),
      [this.executable.path],
      {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: {
          APPIUM_HOME: appiumHome ?? process.env.APPIUM_HOME,
        },
      }
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

    return this;
  }

  public dispose() {
    this.kill();
  }

  public kill() {
    this.proc?.kill('SIGINT');
  }

  public onStderr(listener: AppiumProcessDataListener): AppiumProcess {
    this.proc?.stderr?.on('data', (data: Buffer) => {
      listener(data.toString());
    });
    return this;
  }

  public onStdout(listener: AppiumProcessDataListener): AppiumProcess {
    this.proc?.stdout?.on('data', (data: Buffer) => {
      listener(data.toString());
    });
    return this;
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

type AppiumProcessDataListener = (data: string) => void;
