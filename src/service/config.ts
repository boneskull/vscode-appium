import {
  ConfigurationChangeEvent,
  Disposable,
  workspace,
  window,
  Uri,
} from 'vscode';
import { LoggerService } from './logger';

type ConfigPath = Path<AppiumExtensionConfig>;
type ConfigPathValue<S extends ConfigPath> = PathValue<
  AppiumExtensionConfig,
  S
>;

type ConfigListener<S extends ConfigPath> = (
  value: ConfigPathValue<S>,
  key?: S
) => void;

export class ConfigService implements Disposable {
  private changeListener: Disposable;
  private subscriptions = new Map<
    ConfigPath,
    Set<ConfigListener<ConfigPath>>
  >();

  static readonly namespace = 'appium';

  constructor(private log: LoggerService) {
    this.changeListener = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
        this.emit(event);
      }
    );
  }

  private emit(event: ConfigurationChangeEvent): void {
    const currentFolderUri = ConfigService.getCurrentWorkspaceFolderUri();
    for (let [keypath, listeners] of this.subscriptions.entries()) {
      if (event.affectsConfiguration(keypath, currentFolderUri)) {
        this.log.debug(
          `Configuration changed for ${keypath} in workspace ${currentFolderUri}`
        );
        listeners.forEach((listener) => {
          listener(this.get(keypath), keypath);
        });
      }
    }
  }

  public static get currentWSConfig(): AppiumWorkspaceConfiguration {
    return workspace.getConfiguration(
      ConfigService.namespace,
      ConfigService.getCurrentWorkspaceFolderUri()
    ) as AppiumWorkspaceConfiguration;
  }

  public static getCurrentWorkspaceFolderUri(): Uri | undefined {
    const textEditor = window.activeTextEditor;
    if (textEditor) {
      const { document } = textEditor;
      const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
      return workspaceFolder?.uri;
    }
  }

  public dispose(): void {
    this.changeListener.dispose();
    this.subscriptions.clear();
  }

  public get<S extends ConfigPath>(
    section: S
  ): PathValue<AppiumExtensionConfig, S> {
    return ConfigService.currentWSConfig.get(section) as PathValue<
      AppiumExtensionConfig,
      S
    >;
  }

  public onChange(
    section: ConfigPath,
    listener: ConfigListener<ConfigPath>
  ): ConfigService {
    const listeners = this.subscriptions.get(section) ?? new Set();
    listeners.add(listener);
    this.subscriptions.set(section, listeners);
    return this;
  }
}
