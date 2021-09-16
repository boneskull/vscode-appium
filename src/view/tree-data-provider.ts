import path from 'path';
import {
  commands,
  Disposable,
  Event,
  EventEmitter,
  Position,
  TreeDataProvider,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { screenshot } from '../commands/screenshot';
import { DEFAULT_SERVER_FS_PATH } from '../constants';
import { ServerConfigBusService } from '../server-config-bus';
import { ServerModel } from '../server-model';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
import { RemoteServerService, ServerWatcher } from '../service/remote-server';
import { isServerInfo, isSession, readAppiumServerJson } from '../util';
import { getCurrentWorkspaceFolderUri } from '../workspace';
import {
  AppiumNoSessionsTreeItem,
  AppiumServerTreeItem,
  AppiumSessionTreeItem,
  AppiumTreeItem,
} from './tree-item';

/**
 * This data provider uses these three types.  The first two are data objects.
 * The last one is just a straight-up TreeItem, because there's no underlying
 * data there.  It represents a server with no active sessions, and displays a
 * bit of text to that effect in the tree.
 */
type AppiumTreeData =
  | AppiumServerInfo
  | AppiumSession
  | AppiumNoSessionsTreeItem;

export class AppiumTreeDataProvider
  implements TreeDataProvider<AppiumTreeData>, Disposable
{
  private log = LoggerService.get();
  private config = ConfigService.get();

  private changeEmitter: EventEmitter<
    AppiumTreeData | undefined | null | void
  > = new EventEmitter();
  private disposables: Disposable[] = [];
  private remoteServerService: RemoteServerService;
  private servers: Map<string, ServerModel> = new Map();
  private serverConfigBusService = ServerConfigBusService.get();
  private remoteServerWatchers: Map<string, ServerWatcher> = new Map();

  static readonly viewId = 'appium';

  public readonly onDidChangeTreeData: Event<
    AppiumTreeData | undefined | null | void
  > = this.changeEmitter.event;

  private constructor() {
    this.log.info('AppiumTreeDataProvider created');
    this.remoteServerService = RemoteServerService.get();
    // TODO: get configured servers
  }

  static register(): Disposable[] {
    const disposables = [];
    const log = LoggerService.get();
    const treeDataProvider = new AppiumTreeDataProvider();

    disposables.push(
      window.createTreeView(AppiumTreeDataProvider.viewId, {
        treeDataProvider,
      }),
      commands.registerCommand('appium.refreshServers', () => {
        log.debug('Command: appium.refreshServers');
        treeDataProvider.refresh();
      }),
      commands.registerCommand(
        'appium.refreshServer',
        (item: AppiumServerInfo) => {
          log.debug('Command: appium.refreshServer - %s', item);
          treeDataProvider.refresh(item);
        }
      ),
      commands.registerCommand(
        'appium.screenshot',
        async ({ parent, id }: AppiumSession) => {
          if (treeDataProvider.hasServer(parent)) {
            const server = treeDataProvider.getServer(parent)!;
            return screenshot(server, id);
          } else {
            log.error(
              'Session missing server reference, or server does not exist'
            );
          }
        }
      ),

      commands.registerCommand('appium.addServer', async () => {
        // try to put new file in .vscode
        log.debug('Command: appium.addServer');
        const rootUri = getCurrentWorkspaceFolderUri();
        if (rootUri) {
          try {
            const dirUri = Uri.file(path.join(rootUri.fsPath, '.vscode'));
            await workspace.fs.createDirectory(dirUri);

            let filepath = path.join(dirUri.fsPath, 'new-server.appiumserver');
            let newFileUri = Uri.file(filepath).with({ scheme: 'untitled' });
            await workspace.openTextDocument(newFileUri);
            const edit = new WorkspaceEdit();

            if (!edit.has(newFileUri)) {
              edit.insert(newFileUri, new Position(0, 0), '{}');
              await workspace.applyEdit(edit);
            }

            // Actually show the editor
            await commands.executeCommand('vscode.open', newFileUri);
          } catch (err) {
            log.error(<Error>err);
          }
        }
      })
    );

    return disposables;
  }

  public dispose() {
    this.remoteServerWatchers.forEach((watcher) => watcher.dispose());
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
  }

  public async getChildren(
    element?: AppiumTreeData
  ): Promise<AppiumTreeData[]> {
    if (element) {
      this.log.debug('getting children for %s', element);
      if (isServerInfo(element)) {
        return element.sessions?.length
          ? element.sessions
          : [new AppiumNoSessionsTreeItem(this.log, element)];
      }
      return [];
    }
    if (!this.servers.size) {
      this.log.debug('getting root servers');

      await this.findServers();

      this.serverConfigBusService.onServerChanged(
        async (fsPath) => {
          const server = await this.getServerModel(fsPath, true);
          if (this.remoteServerWatchers.has(fsPath)) {
            this.unmonitorServer(server);
            if (this.servers.has(fsPath)) {
              this.changeEmitter.fire();
            }
          }
          await this.monitorServer(server);
        },
        null,
        this.disposables
      );
      this.serverConfigBusService.onServerDeleted(
        async (fsPath) => {
          if (this.servers.has(fsPath)) {
            this.unmonitorServer(this.servers.get(fsPath)!);
            this.servers.delete(fsPath);
            this.changeEmitter.fire();
          }
        },
        null,
        this.disposables
      );

      this.listenForServerUpdates();
    }
    return [...this.servers.values()];
  }

  /**
   * Gets or upserts a server.
   * @param fsPath Path to `.appiumserver` file
   * @param refresh If `true`, reload the server from disk even if we have it stored in `this.servers`
   * @returns A new, existing, or existing & updated server
   */
  private async getServerModel(
    fsPath: string,
    refresh = false
  ): Promise<ServerModel> {
    const uri = Uri.file(fsPath);
    if (this.servers.has(fsPath)) {
      const server = this.servers.get(fsPath)!;
      if (refresh) {
        // TODO: this can be optimized, as it's already in memory somewhere... maybe.
        return server.update(await readAppiumServerJson(uri));
      }
      return server;
    }
    const serverConfig = await readAppiumServerJson(uri);
    const server = new ServerModel(serverConfig, uri);
    this.servers.set(fsPath, server);
    return server;
  }

  private async monitorServer(server: ServerModel): Promise<void> {
    if (server.valid) {
      const watcher = this.remoteServerService.watch(server);
      this.log.debug('Monitoring server at "%s"', server.fsPath);
      this.remoteServerWatchers.set(server.fsPath, watcher);
    } else {
      this.log.debug(
        'Not monitoring server at "%s"; incomplete definition',
        server.fsPath
      );
    }
    this.servers.set(server.fsPath, server);
  }

  private unmonitorServer(server: ServerModel): void {
    if (this.remoteServerWatchers.has(server.fsPath)) {
      this.remoteServerWatchers.get(server.fsPath)!.dispose();
    }
  }

  public getParent(
    element: AppiumServerInfo | AppiumSession
  ): AppiumServerInfo | undefined {
    if (isSession(element)) {
      if (this.servers.has(element.parent)) {
        return this.servers.get(element.parent)!;
      }
      this.log.error(
        new ReferenceError(`Session ${element.toString()} missing parent!`)
      );
    }
  }

  public getServer(parent?: string) {
    if (typeof parent === 'string') {
      return this.servers.get(parent);
    }
  }

  public getTreeItem<T extends AppiumTreeData>(element: T): AppiumTreeItem<T> {
    let treeItem;
    if (isServerInfo(element)) {
      treeItem = new AppiumServerTreeItem(element);
    } else if (isSession(element)) {
      treeItem = new AppiumSessionTreeItem(element);
    } else {
      treeItem = element;
    }
    return treeItem;
  }

  public hasServer(nickname?: string) {
    if (typeof nickname === 'string') {
      return this.servers.has(nickname);
    }
    return false;
  }

  public refresh(element?: AppiumTreeData): void {
    if (isServerInfo(element)) {
      this.log.debug('Refreshing element %s', element.nickname);
      this.changeEmitter.fire(element);
    } else if (isSession(element)) {
      // do nothing
    } else {
      this.log.debug('Appium tree root-level refresh');
      this.changeEmitter.fire(element);
    }
  }

  private async findServers(): Promise<void> {
    const serverFiles = await workspace.findFiles('.vscode/*.appiumserver');
    this.log.debug('Found %d appium server file(s)', serverFiles.length);

    if (serverFiles.length) {
      await Promise.all(
        serverFiles.map((uri) =>
          this.getServerModel(uri.fsPath).then((server) => {
            this.monitorServer(server);
          })
        )
      );
    } else {
      // // TODO: watch changes to defaults
      // const defaultServerConfig = this.config.get('sessionDefaults');
      // const defaultServer = this.servers.has(DEFAULT_SERVER_FS_PATH)
      //   ? this.servers.get(DEFAULT_SERVER_FS_PATH)!
      //   : new ServerModel(defaultServerConfig);
      // if (defaultServer.valid) {
      //   const defaultWatcher = this.remoteServerService.watch(defaultServer);
      //   this.disposables.push(defaultWatcher);
      // }
      // this.servers.set(DEFAULT_SERVER_FS_PATH, defaultServer);
    }
  }

  /**
   * Subscribe to server status updates, and refresh the tree if the status differs.
   */
  private listenForServerUpdates() {
    this.remoteServerService.onDidUpdateServer(
      (info: AppiumServerInfo) => {
        // TODO: delay getTreeItem until this happens at least once
        this.log.debug('server update for %s', info.nickname);
        if (this.servers.has(info.fsPath)) {
          // it is *critically important* that we use the SAME `info` object here, or
          // the update will not work.
          const server = this.servers.get(info.fsPath)!;
          Object.assign(server, info);
          this.changeEmitter.fire(server);
        } else {
          this.log.warn('Congratulations! This is a bug and YOU found it.');
          this.changeEmitter.fire();
        }
      },
      this,
      this.disposables
    );
  }
}
