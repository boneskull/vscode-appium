import {
  ConfigurationChangeEvent,
  Disposable,
  workspace,
  window,
  Uri,
} from 'vscode';
import { LoggerService } from './logger';
import readPkgUp from 'read-pkg-up';

type ConfigListener<S extends ConfigPath> = (
  value: ConfigPathValue<S>,
  key?: S
) => void;

let configService: ConfigService;

export class ConfigService implements Disposable {
  private changeListener: Disposable;
  private log = LoggerService.get();
  private subscriptions = new Map<
    ConfigPath,
    Set<ConfigListener<ConfigPath>>
  >();

  static readonly namespace = 'appium';
  private sectionNames: ConfigPath[] = [];

  private constructor() {
    this.changeListener = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
        this.emit(event);
      }
    );
  }

  static get(): ConfigService {
    if (configService) {
      return configService;
    }
    return (configService = new ConfigService());
  }

  public static get currentWSConfig(): AppiumWorkspaceConfiguration {
    // LoggerService.get().debug(
    //   workspace.getConfiguration(
    //     ConfigService.namespace,
    //     ConfigService.getCurrentWorkspaceFolderUri()
    //   )
    // );
    return workspace.getConfiguration(
      ConfigService.namespace,
      ConfigService.getCurrentWorkspaceFolderUri()
    ) as AppiumWorkspaceConfiguration;
  }

  /**
   * Compacts an object by removing all undefined values, empty arrays, and empty strings.
   * Does not remove empty objects
   * @param obj Object to compact
   * @returns
   */
  static compact<T extends { [key: string]: any }>(obj: T): Partial<T> {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      if (
        !(
          ((Array.isArray(value) || typeof value === 'string') &&
            !value.length) ||
          value === undefined ||
          value === null
        )
      ) {
        acc[key as keyof T] = value;
      }
      return acc;
    }, {} as Partial<T>);
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
}
