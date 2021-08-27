import { Disposable, Terminal, window } from 'vscode';
import { AppiumPseudoterminal } from './appium-pty';
import { LoggerService } from './logger-service';

export class LocalServerService implements Disposable {
  private term?: Terminal;
  private pty?: AppiumPseudoterminal;

  constructor(private log: LoggerService) {}

  public dispose() {
    this.pty?.dispose();
    this.term?.dispose();
  }

  public async start(executable: AppiumExecutable, config: AppiumServerConfig) {
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
