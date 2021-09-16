import {
  workspace,
  Event,
  EventEmitter,
  Uri,
  TextDocument,
  Disposable,
} from 'vscode';

let serverConfigBusService: ServerConfigBusService;

export class ServerConfigBusService implements Disposable {
  private changedServerEmitter: EventEmitter<string> =
    new EventEmitter<string>();
  public readonly onServerChanged: Event<string> =
    this.changedServerEmitter.event;

  private deletedServerEmitter: EventEmitter<string> =
    new EventEmitter<string>();
  public readonly onServerDeleted: Event<string> =
    this.deletedServerEmitter.event;
  private disposables: Disposable[] = [];
  private constructor() {
    workspace.onDidSaveTextDocument(
      (document: TextDocument) => {
        if (
          document.uri.scheme === 'file' &&
          document.fileName.endsWith('.appiumserver')
        ) {
          this.emitServerChanged(document.uri.fsPath);
        }
      },
      null,
      this.disposables
    );
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
  }
  public emitServerChanged(fsPath: string): void {
    this.changedServerEmitter.fire(fsPath);
  }

  public emitServerDeleted(fsPath: string): void {
    this.deletedServerEmitter.fire(fsPath);
  }

  public static get(): ServerConfigBusService {
    if (!serverConfigBusService) {
      serverConfigBusService = new ServerConfigBusService();
    }
    return serverConfigBusService;
  }
}
