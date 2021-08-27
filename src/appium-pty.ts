import chalk from 'chalk';
import { format } from 'util';
import { Disposable, EventEmitter, Pseudoterminal } from 'vscode';
import { AppiumProcess } from './appium-process';
import { LoggerService } from './logger-service';

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

  public onDidWrite = this.ptyWriter.event;

  constructor(
    private log: LoggerService,
    private executable: AppiumExecutable,
    private config: AppiumServerConfig,
    private ptyWriter: NormalizingEventEmitter = new NormalizingEventEmitter()
  ) {}

  dispose() {
    this.appium?.dispose();
  }

  public open(): void {
    this.ptyWriter.log(
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
        this.ptyWriter.fire(data);
      })
      .onStdout((data) => {
        this.log.debug('APPIUM: %s', data);
        this.ptyWriter.fire(data.toString());
      });
  }

  public close(): void {
    // what to do?
  }

  public handleInput(data: string): void {
    if (
      data === TerminationKeycodes.ctrlC ||
      data === TerminationKeycodes.ctrlD
    ) {
      this.ptyWriter.log('Stopping local Appium server...');
      this.appium?.dispose();
    } else {
      this.ptyWriter.fire(data);
    }
  }
}
