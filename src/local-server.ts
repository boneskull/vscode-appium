import { Disposable, Terminal, window } from 'vscode';
import { AppiumPseudoterminal } from './pty';
import { ResolverService } from './service/local-resolver';
import { LoggerService } from './service/logger';

export class LocalServer implements Disposable {
  /**
   * I don't know if disposing the Terminal causes the pty to dispose as well,
   * so that's why this is here.
   */
  private pty?: AppiumPseudoterminal;
  private term?: Terminal;

  constructor(private log: LoggerService, private resolver?: ResolverService) {}

  public dispose() {
    this.pty?.dispose();
    this.term?.dispose();
  }

  public async start(
    config: AppiumLocalServerConfig,
    executable?: AppiumExecutable
  ) {
    if (!executable) {
      this.resolver = this.resolver ?? new ResolverService(this.log);
      executable = await this.resolver.resolve(config);
    }
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
