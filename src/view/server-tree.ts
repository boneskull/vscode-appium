import path from 'path';
import {
  Event,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeItemLabel,
  Uri,
} from 'vscode';
import { LoggerService } from '../service/logger';
import { AppiumSession, AppiumServer, AppiumStatus } from '../server';
import { ConfigService } from '../service/config';

interface IAppiumTreeItem extends TreeItem {
  getChildren(): ProviderResult<IAppiumTreeItem[]>;
}

class AppiumServerTreeItem extends TreeItem implements IAppiumTreeItem {
  private status?: AppiumStatus;
  private server: AppiumServer;
  private children?: AppiumSessionTreeItem[];

  constructor(
    log: LoggerService,
    serverOrConfig: AppiumSessionConfig | AppiumServer,
    collapsibleState?: TreeItemCollapsibleState
  ) {
    const config =
      serverOrConfig instanceof AppiumServer
        ? serverOrConfig.config
        : serverOrConfig;
    const label = `${config.host}:${config.port}`;
    super(label, collapsibleState);
    this.tooltip = `${this.label} [v${config.version}]`;
    this.description = `Appium Server v${config.version} at ${this.label}`;
    this.server =
      serverOrConfig instanceof AppiumServer
        ? serverOrConfig
        : new AppiumServer(log, serverOrConfig);
  }

  async getChildren(): Promise<IAppiumTreeItem[] | undefined> {
    if (this.children) {
      return this.children;
    }
    const result = await this.server.getSessions();
    if (result.ok) {
      this.children = [...result.val].map((session) => {
        return new AppiumSessionTreeItem(this.server, session);
      });
      return this.children;
    }
    // TODO handle error
  }
}

class AppiumSessionTreeItem extends TreeItem implements IAppiumTreeItem {
  private server: AppiumServer;

  constructor(
    server: AppiumServer,
    session: AppiumSession,
    collapsibleState?: TreeItemCollapsibleState
  ) {
    super(session.id, collapsibleState);
    this.tooltip = `${this.label} [${session.capabilities.platformName}]`;
    this.description = `Appium Session ${session.id}`;
    this.server = server;
  }

  getChildren(): ProviderResult<IAppiumTreeItem[]> {
    return [];
  }
}

export class AppiumTreeDataProvider
  implements TreeDataProvider<IAppiumTreeItem>
{
  private defaultServer: AppiumServer;
  private servers: AppiumServerTreeItem[] = [];

  constructor(private log: LoggerService, config: ConfigService) {
    this.log.info('AppiumTreeDataProvider created');
    this.defaultServer = new AppiumServer(log, config.get('sessionDefaults'));
    // TODO allow more servers
  }

  onDidChangeTreeData?:
    | Event<void | IAppiumTreeItem | null | undefined>
    | undefined;
  getTreeItem(element: IAppiumTreeItem): TreeItem | Thenable<IAppiumTreeItem> {
    return element;
  }
  getChildren(element?: IAppiumTreeItem): ProviderResult<IAppiumTreeItem[]> {
    if (element) {
      return element.getChildren();
    } else if (this.servers.length) {
      return this.servers;
    }
    const servers = (this.servers = [
      new AppiumServerTreeItem(this.log, this.defaultServer),
    ]);
    return servers;
  }
}
