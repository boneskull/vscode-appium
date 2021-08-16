/**
 * extension-specific configuration
 */
declare interface AppiumUserServerDefaults {
  address: string;
  port: number;
  executablePath: string;
  proxyUrl: string;
  plainTextUsername: string;
  plainTextPassword: string;
  queryString: string;
  drivers: string[];
  plugins: string[];
}

declare type AppiumUserDefaults = AppiumUserServerDefaults;

declare interface AppiumExtensionConfig {
  defaults: AppiumUserDefaults;
}

/**
 * The result of running {@link ResolverService#resolve}.
 */
declare interface AppiumExecutable {
  /**
   * Path to the valid Appium executable.
   */
  path: string;

  /**
   * The version of the Appium executable.
   */
  version: string;
}

declare interface AppiumIPCReadyMessage {
  type: "ready";
}

declare interface AppiumIPCFailMessage {
  type: "fail";
  reason: string;
}

declare interface AppiumIPCStartCommand {
  type: "command";
  command: "start";
  args: { [key: string]: string };
}

declare interface AppiumIPCStartedMessage {
  type: "started";
  details: { [key: string]: string };
}

declare type AppiumIPCCommand = AppiumIPCStartCommand;
declare type AppiumIPCMessage =
  | AppiumIPCReadyMessage
  | AppiumIPCFailMessage
  | AppiumIPCStartedMessage
  | AppiumIPCCommand;
