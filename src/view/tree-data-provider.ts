import {
  Event,
  ProviderResult,
  TreeDataProvider,
  EventEmitter,
  Disposable,
} from 'vscode';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
import { RemoteServerService } from '../service/remote-server';
import {
  AppiumTreeItem,
  AppiumServerTreeItem,
  AppiumSessionTreeItem,
  AppiumNoSessionsTreeItem,
} from './tree-item';
import { deepEqual } from 'fast-equals';

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
  private changeEmitter: EventEmitter<
    AppiumTreeData | undefined | null | void
  > = new EventEmitter();
  private disposables: Disposable[] = [];
  private remoteServerService: RemoteServerService;
  private servers: Map<string, AppiumServerInfo> = new Map();

  static readonly viewId = 'appium';

  public readonly onDidChangeTreeData: Event<
    AppiumTreeData | undefined | null | void
  > = this.changeEmitter.event;

  constructor(private log: LoggerService, private config: ConfigService) {
    this.log.info('AppiumTreeDataProvider created');
    this.remoteServerService = RemoteServerService.get(this.log, this.config);
    // TODO: get configured servers
  }

  public dispose() {
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
  }

  public getChildren(
    element?: AppiumTreeData
  ): ProviderResult<AppiumTreeData[]> {
    if (element) {
      this.log.debug('getting children for %s', element);
      if (AppiumTreeDataProvider.isServerInfo(element)) {
        return element.sessions?.length
          ? element.sessions
          : [new AppiumNoSessionsTreeItem(this.log, element)];
      }
      return [];
    }
    if (!this.servers.size) {
      this.log.debug('getting root servers');
      this.initDefaultServer();
      this.listenForServerUpdates();
    }
    return [...this.servers.values()];
  }

  public getParent(
    element: AppiumServerInfo | AppiumSession
  ): AppiumServerInfo | undefined {
    if (AppiumTreeDataProvider.isSession(element)) {
      return this.servers.get(element.serverNickname);
    }
  }

  public getTreeItem<T extends AppiumTreeData>(element: T): AppiumTreeItem<T> {
    let treeItem;
    if (AppiumTreeDataProvider.isServerInfo(element)) {
      treeItem = new AppiumServerTreeItem(this.log, element);
    } else if (AppiumTreeDataProvider.isSession(element)) {
      treeItem = new AppiumSessionTreeItem(this.log, element);
    } else {
      treeItem = element;
    }
    return treeItem;
  }

  public refresh(element?: AppiumTreeData): void {
    if (AppiumTreeDataProvider.isServerInfo(element)) {
      this.log.debug('Refreshing element %s', element.nickname);
      this.changeEmitter.fire(element);
    } else if (AppiumTreeDataProvider.isSession(element)) {
      // do nothing
    } else {
      this.log.debug('Appium tree root-level refresh');
      this.changeEmitter.fire(element);
    }
  }

  private static isServerInfo(value: any): value is AppiumServerInfo {
    return value && typeof value === 'object' && value.host && value.port;
  }

  private static isSession(value: any): value is AppiumSession {
    return value && typeof value === 'object' && value.id && value.capabilities;
  }

  private initDefaultServer() {
    const defaultServer = this.config.get('sessionDefaults');
    const defaultWatcher = this.remoteServerService.watch(defaultServer);
    this.servers.set(defaultWatcher.info.nickname, defaultWatcher.info);
    this.disposables.push(defaultWatcher);
  }

  /**
   * Subscribe to server status updates, and refresh the tree if the status differs.
   */
  private listenForServerUpdates() {
    this.remoteServerService.onDidUpdateServer(
      (info: AppiumServerInfo) => {
        if (this.serverInfoDidChange(info)) {
          // TODO: delay getTreeItem until this happens at least once
          this.log.debug('server update for %s', info.nickname);
          if (this.servers.has(info.nickname)) {
            // it is *critically important* that we use the SAME `info` object here, or
            // the update will not work.
            Object.assign(this.servers.get(info.nickname)!, info);
            this.changeEmitter.fire(this.servers.get(info.nickname)!);
          } else {
            this.log.warn('Congratulations! This is a bug and YOU found it.');
            this.changeEmitter.fire();
          }
        }
      },
      this,
      this.disposables
    );
  }

  private serverInfoDidChange(info: AppiumServerInfo) {
    const cachedInfo = this.servers.get(info.nickname);
    return !cachedInfo || !deepEqual(cachedInfo, info);
  }
}
