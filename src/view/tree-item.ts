import { TreeItem, ThemeIcon, TreeItemCollapsibleState } from 'vscode';
import { DEFAULT_SERVER_FS_PATH } from '../constants';
import { LoggerService } from '../service/logger';

export interface AppiumTreeItem<T> extends TreeItem {
  contextValue: string;
}

export class AppiumServerTreeItem implements AppiumTreeItem<AppiumServerInfo> {
  static readonly contextValue = 'appiumServer';

  public readonly contextValue = AppiumServerTreeItem.contextValue;
  public readonly id: string;
  private log = LoggerService.get();

  constructor(private info: AppiumServerInfo) {
    this.info = info;
    this.id = `${info.host}:${info.port}`;
  }

  public get collapsibleState() {
    return this.info.status.online
      ? this.info.sessions?.length
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.Collapsed;
  }

  public get description() {
    return this.info.host && this.info.port
      ? this.info.status.online
        ? 'ONLINE'
        : 'OFFLINE'
      : 'UNKNOWN';
  }

  public get iconPath() {
    return new ThemeIcon(
      this.info.status.build?.version ? 'vm-running' : 'vm-outline'
    );
  }

  public get label() {
    return this.info.nickname ?? `${this.info.host}:${this.info.port}`;
  }

  public get tooltip() {
    let result;
    if (this.info.status.build?.version) {
      result = `**${this.label}** (v${this.info.status.build.version}) - _ONLINE_`;
    }
    if (this.info.port && this.info.host) {
      result = `**${this.label}** - _OFFLINE_`;
    } else {
      result = `**${this.label}** - _UNKNOWN; set \`host\` & \`port\`_`;
    }
    if (this.info.fsPath !== DEFAULT_SERVER_FS_PATH) {
      result = `${result} (from \`${this.info.fsPath}\`)`;
    }
    return result;
  }

  public toString(): string {
    return String(this.description);
  }
}

export class AppiumSessionTreeItem
  extends TreeItem
  implements AppiumTreeItem<AppiumSession>
{
  static readonly contextValue = 'appiumSession';

  public readonly contextValue = AppiumSessionTreeItem.contextValue;
  private log = LoggerService.get();

  constructor(session: AppiumSession) {
    super(session.id);
    this.tooltip = `${this.label} [${session.capabilities.platformName}]`;
    this.description = `Appium Session ${session.id}`;
  }

  public toString(): string {
    return String(this.description);
  }
}

export class AppiumNoSessionsTreeItem
  extends TreeItem
  implements AppiumTreeItem<string>
{
  static readonly contextValue = 'appiumNoSessions';

  public contextValue = AppiumNoSessionsTreeItem.contextValue;

  constructor(private log: LoggerService, private info: AppiumServerInfo) {
    super('(no active sessions)');
    this.id = `appiumNoSessions-${info.host}:${info.port}`;
  }
}
