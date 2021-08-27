import { CamelCasedProperties, JsonObject } from 'type-fest';
import { WorkspaceConfiguration } from 'vscode';
import { ServerConfig } from './appium-config';

declare global {
  interface AppiumExtensionServerConfig {
    appiumHome?: string;
    executablePath?: string;
    useAllPlugins?: boolean;
    configFile?: string;
    useBundledAppium: boolean;
  }

  type AppiumServerConfig = AppiumExtensionServerConfig &
    CamelCasedProperties<ServerConfig>;

  interface AppiumSessionConfig {
    host: string;
    password?: string;
    pathname?: string;
    port: number;
    protocol: 'http' | 'https';
    remoteAppiumVersion: '1.x' | '2.x';
    username?: string;
  }

  interface AppiumExtensionConfig {
    serverDefaults: AppiumServerConfig;
    sessionDefaults: AppiumSessionConfig;
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
    args: { [key: string]: string };
    command: 'start';
    type: 'command';
  }

  interface AppiumIPCStartedMessage {
    details: { [key: string]: string };
    type: 'started';
  }

  interface AppiumSessionsResponse extends JsonObject {
    sessionId?: string;
    status: number;
    value: { id: string }[];
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
}
