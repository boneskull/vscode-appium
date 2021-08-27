import {
  ConfigurationChangeEvent,
  Disposable,
  workspace,
  window,
} from 'vscode';
import { LoggerService } from './logger-service';

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
  static readonly namespace = 'appium';
  private changeListener: Disposable;
  private subscriptions = new Map<
    ConfigPath,
    Set<ConfigListener<ConfigPath>>
  >();

  constructor(private log: LoggerService) {
    this.changeListener = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
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
    );
  }

  public onChange<S extends ConfigPath>(
    section: S,
    listener: ConfigListener<S>
  ) {
    if (!this.subscriptions.has(section)) {
      this.subscriptions.set(section, new Set());
    }
    const listeners = this.subscriptions.get(section) as Set<ConfigListener<S>>;
    listeners.add(listener);
  }

  get<S extends ConfigPath>(section: S): PathValue<AppiumExtensionConfig, S> {
    return ConfigService.currentWSConfig.get(section) as PathValue<
      AppiumExtensionConfig,
      S
    >;
  }

  static get currentWSConfig(): AppiumWorkspaceConfiguration {
    return workspace.getConfiguration(
      ConfigService.namespace,
      ConfigService.getCurrentWorkspaceFolderUri()
    ) as AppiumWorkspaceConfiguration;
  }

  dispose() {
    this.changeListener.dispose();
    this.subscriptions.clear();
  }

  static getCurrentWorkspaceFolderUri() {
    const textEditor = window.activeTextEditor;
    if (!textEditor) {
      return;
    }
    const { document } = textEditor;
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return;
    }
    return workspaceFolder.uri;
  }
}
