import { Disposable, Terminal, window } from 'vscode';
import { AppiumPseudoterminal } from './pty';
import { LoggerService } from './service/logger';

export class LocalServer implements Disposable {
  private term?: Terminal;
  /**
   * I don't know if disposing the Terminal causes the pty to dispose as well,
   * so that's why this is here.
   */
  private pty?: AppiumPseudoterminal;

  constructor(private log: LoggerService) {}

  public dispose() {
    this.pty?.dispose();
    this.term?.dispose();
  }

  public start(executable: AppiumExecutable, config: AppiumServerConfig) {
    this.log.info(
      'Starting Appium server v%s at %s',
      executable.version,
      executable.path
    );

    this.pty = new AppiumPseudoterminal(this.log, executable, config);

    this.term = window.createTerminal({
      name: 'Appium Server',
      pty: this.pty,
    });
    this.term.show();
  }

  public async stop() {
    this.dispose();
  }
}
