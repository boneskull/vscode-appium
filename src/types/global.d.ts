import { Err, Ok } from 'ts-results';
import { JSONSchema7 } from 'json-schema';
import { CamelCasedProperties } from 'type-fest';
import { Disposable, Uri, WorkspaceConfiguration } from 'vscode';
import { ServerConfig } from './appium-config';

declare global {
  interface AppiumExtensionLocalServerConfig {
    appiumHome?: string;
    configFile?: string;
    executablePath?: string;
    useAllPlugins?: boolean;
    useBundledAppium: boolean;
  }

  type AppiumLocalServerConfig = AppiumExtensionLocalServerConfig &
    CamelCasedProperties<ServerConfig>;

  interface AppiumSessionConfig {
    host?: string;
    nickname?: string;
    password?: string;
    pathname?: string;
    port?: number;
    protocol?: 'http' | 'https';
    remoteAppiumVersion?: '1.x' | '2.x';
    serverConfig?: AppiumLocalServerConfig;
    username?: string;
    version?: string;
  }

  interface AppiumExtensionConfig {
    serverDefaults: AppiumLocalServerConfig;
    sessionDefaults: AppiumSessionConfig;
  }

  interface AppiumSession {
    id: string;
    capabilities: Record<string, any>;
    parent: string;
  }

  interface AppiumServerInfo extends AppiumSessionConfig {
    status: {
      build?: AppiumBuild;
      online?: boolean;
    };
    sessions?: AppiumSession[];
    fsPath: string;
  }

  type AppiumResultContext<C = object> = { context: C };

  type AppiumOkResult<T, C> = Ok<T> & AppiumResultContext<C>;

  type AppiumErrResult<E, C> = Err<E> & AppiumResultContext<C>;

  type AppiumResult<T, E, C> = AppiumOkResult<T, C> | AppiumErrResult<E, C>;

  interface AppiumBuild {
    version: string;
    'git-sha': string;
    built: string;
  }

  interface AppiumStatus {
    build: AppiumBuild;
  }

  type AppiumWorkspaceConfiguration = AppiumExtensionConfig &
    WorkspaceConfiguration;

  /**
   * The result of running {@link ResolverService#resolve}.
   */
  interface AppiumExecutable {
    /**
     * Path to the valid Appium executable.
     */
    path: string;
    /**
     * The version of the Appium executable.
     */
    version: string;
  }

  interface AppiumIPCReadyMessage {
    type: 'ready';
  }

  interface AppiumIPCFailMessage {
    reason: string;
    type: 'fail';
  }

  interface AppiumIPCStartCommand {
    args: AppiumLocalServerConfig;
    command: 'start';
    type: 'command';
  }

  interface AppiumIPCStartedMessage {
    details: { [key: string]: string };
    type: 'started';
  }

  type AppiumIPCCommand = AppiumIPCStartCommand;
  type AppiumIPCMessage =
    | AppiumIPCReadyMessage
    | AppiumIPCFailMessage
    | AppiumIPCStartedMessage
    | AppiumIPCCommand;

  // recursively loop through nested properties and build dot-notation types
  type PathImpl<T, K extends keyof T> = K extends string
    ? T[K] extends Record<string, any>
      ? T[K] extends ArrayLike<any>
        ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
        : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
      : K
    : never;

  // type helper to kick of the recursive PathImpl call
  type Path<T> = PathImpl<T, keyof T> | keyof T;

  // helper to recursively get the value type for a dot-notation path through an object
  type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Rest extends Path<T[K]>
        ? PathValue<T[K], Rest>
        : never
      : never
    : P extends keyof T
    ? T[P]
    : never;

  type ConfigPath = Path<AppiumExtensionConfig>;
  type ConfigPathValue<S extends ConfigPath> = PathValue<
    AppiumExtensionConfig,
    S
  >;

  /**
   * The configuration definitions in the `contributions` section of the extension manifest
   * are essentially just JSON Schema definitions.  We take those and add some contextual info, which is this.
   */
  interface AppiumSettingsJsonMetadata extends JSONSchema7 {
    /**
     * Corresponds to the "leaf" of the section. e.g., given key `appium.server.port`, `id` is `port`.
     */
    id: keyof AppiumSessionConfig;
    /**
     * The entire section name, if it is a default setting.
     * Used to cross-reference defaults when creating a new file.
     */
    configPath?: ConfigPath;

    /**
     * User-settable nickname
     */
    nickname: string;

    /**
     * This is a VSCode-specific field.  The manifest contains mostly these `markdownDescription` fields. The webview does not render markdown, however.  We'll use this as the last resort for describing a setting
     */
    markdownDescription?: string;
  }
}

declare module '@wdio/types/build/Capabilities' {
  interface SauceLabsCapabilities {
    appiumVersion?: string;
  }
}
