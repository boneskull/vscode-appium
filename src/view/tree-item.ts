import { TreeItem, ThemeIcon, TreeItemCollapsibleState } from 'vscode';
import { LoggerService } from '../service/logger';

export interface AppiumTreeItem<T> extends TreeItem {
  contextValue: string;
}

export class AppiumServerTreeItem implements AppiumTreeItem<AppiumServerInfo> {
  static readonly contextValue = 'appiumServer';

  public readonly contextValue = AppiumServerTreeItem.contextValue;
  public readonly id: string;

  constructor(private log: LoggerService, private info: AppiumServerInfo) {
    this.info = info;
    this.id = `${info.host}:${info.port}`;
  }

  get label() {
    return this.info.nickname ?? `${this.info.host}:${this.info.port}`;
  }

  get iconPath() {
    return new ThemeIcon(
      this.info.status.build?.version ? 'vm-running' : 'vm-outline'
    );
  }

  get collapsibleState() {
    return this.info.status.online
      ? this.info.sessions?.length
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.Collapsed;
  }

  get tooltip() {
    if (this.info.status.build?.version) {
      return `**${this.label}** (v${this.info.status.build.version}) - _ONLINE_`;
    }
    return `**${this.label}** - _OFFLINE_`;
  }

  get description() {
    return this.info.status.online ? 'ONLINE' : 'OFFLINE';
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

  constructor(private log: LoggerService, session: AppiumSession) {
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
  constructor(private log: LoggerService, private info: AppiumServerInfo) {
    super('(no active sessions)');
    this.id = `appiumNoSessions-${info.host}:${info.port}`;
  }

  static readonly contextValue = 'appiumNoSessions';
  public contextValue = AppiumNoSessionsTreeItem.contextValue;
}
