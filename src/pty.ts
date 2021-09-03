import chalk from 'chalk';
import { format } from 'util';
import { Disposable, EventEmitter, Pseudoterminal, Event } from 'vscode';
import { AppiumProcess } from './process';
import { LoggerService } from './service/logger';

class NormalizingEventEmitter extends EventEmitter<string> {
  public fire(data: string) {
    super.fire(data.replace(/\n/g, '\r\n'));
  }

  public log(data: string) {
    this.fire(`${data}\r\n`);
  }
}

enum TerminationKeycodes {
  ctrlC = '\x03',
  ctrlD = '\x04',
}

export class AppiumPseudoterminal implements Pseudoterminal, Disposable {
  private appium?: AppiumProcess;

  private writeEmitter: NormalizingEventEmitter;
  private closeEmitter: EventEmitter<void>;

  public onDidWrite: Event<string>;
  public onDidClose: Event<void>;

  constructor(
    private log: LoggerService,
    private executable: AppiumExecutable,
    private config: AppiumServerConfig
  ) {
    this.writeEmitter = new NormalizingEventEmitter();
    this.closeEmitter = new EventEmitter<void>();

    this.onDidWrite = this.writeEmitter.event;
    this.onDidClose = this.closeEmitter.event;
  }

  dispose() {
    this.appium?.dispose();
  }

  public open(): void {
    this.writeEmitter.log(
      format(
        chalk.dim('Starting Appium v%s at %s with options: %O'),
        this.executable.version,
        this.executable.path,
        this.config
      )
    );

    const appium = (this.appium = AppiumProcess.create(
      this.log,
      this.executable,
      this.config
    ));

    appium
      .onStderr((data) => {
        this.log.debug('APPIUM: %s', data);
        this.writeEmitter.fire(data);
      })
      .onStdout((data) => {
        this.log.debug('APPIUM: %s', data);
        this.writeEmitter.fire(data.toString());
      });
  }

  public close(): void {
    this.appium?.kill();
    this.closeEmitter.fire();
  }

  public handleInput(data: string): void {
    if (
      data === TerminationKeycodes.ctrlC ||
      data === TerminationKeycodes.ctrlD
    ) {
      this.writeEmitter.log('Stopping local Appium server...');
      this.appium?.dispose();
    } else {
      this.writeEmitter.fire(data);
    }
  }
}
