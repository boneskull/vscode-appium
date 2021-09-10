import { CamelCasedProperties } from 'type-fest';
import { WorkspaceConfiguration } from 'vscode';
import { AppiumServerBuild } from '../src/remote-server';
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
    host: string;
    nickname?: string;
    password?: string;
    pathname?: string;
    port: number;
    protocol: 'http' | 'https';
    remoteAppiumVersion: '1.x' | '2.x';
    serverConfig?: AppiumLocalServerConfig;
    username?: string;
    version?: string;
  }

  interface AppiumExtensionConfig {
    serverDefaults: AppiumLocalServerConfig;
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

  interface AppiumSession {
    id: string;
    capabilities: Record<string, any>;
    serverNickname: string;
  }

  interface AppiumServerInfo {
    nickname: string;
    host: string;
    port: number;
    status: {
      build?: AppiumServerBuild;
      online?: boolean;
    };
    sessions?: AppiumSession[];
  }
}

declare module '@wdio/types/build/Capabilities' {
  interface SauceLabsCapabilities {
    appiumVersion?: string;
  }
}
