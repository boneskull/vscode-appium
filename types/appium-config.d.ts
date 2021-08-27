/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * IP address to listen on
 */
export type AddressConfig = string;
/**
 * Whether the Appium server should allow web browser connections from any host
 */
export type AllowCorsConfig = boolean;
/**
 * Set which insecure features are allowed to run in this server's sessions. Features are defined on a driver level; see documentation for more details. Note that features defined via "deny-insecure" will be disabled, even if also listed here. If string, a path to a text file containing policy or a comma-delimited list.
 */
export type AllowInsecureConfig = string[] | string;
/**
 * Base path to use as the prefix for all webdriver routes running on the server
 */
export type BasePathConfig = string;
/**
 * Callback IP address (default: same as "address")
 */
export type CallbackAddressConfig = string;
/**
 * Callback port (default: same as "port")
 */
export type CallbackPortConfig = number;
/**
 * Add exaggerated spacing in logs to help with visual inspection
 */
export type DebugLogSpacingConfig = boolean;
/**
 * Set the default desired capabilities, which will be set on each session unless overridden by received capabilities. If a string, a path to a JSON file containing the capabilities, or raw JSON.
 */
export type DefaultCapabilitiesConfig =
  | {
      [k: string]: unknown;
    }
  | string;
/**
 * Set which insecure features are not allowed to run in this server's sessions. Features are defined on a driver level; see documentation for more details. Features listed here will not be enabled even if also listed in "allow-insecure", and even if "relaxed-security" is enabled. If string, a path to a text file containing policy or a comma-delimited list.
 */
export type DenyInsecureConfig = string[] | string;
/**
 * A list of drivers to activate. By default, all installed drivers will be activated.  If a string, must be valid JSON
 */
export type DriversConfig = string | string[];
/**
 * Number of seconds the Appium server should apply as both the keep-alive timeout and the connection timeout for all requests. A value of 0 disables the timeout.
 */
export type KeepAliveTimeoutConfig = number;
/**
 * Use local timezone for timestamps
 */
export type LocalTimezoneConfig = boolean;
/**
 * Also send log output to this file
 */
export type LogConfig = string;
/**
 * One or more log filtering rules
 */
export type LogFiltersConfig = string[];
/**
 * Log level (console[:file])
 */
export type LogLevelConfig =
  | "info"
  | "info:debug"
  | "info:info"
  | "info:warn"
  | "info:error"
  | "warn"
  | "warn:debug"
  | "warn:info"
  | "warn:warn"
  | "warn:error"
  | "error"
  | "error:debug"
  | "error:info"
  | "error:warn"
  | "error:error"
  | "debug"
  | "debug:debug"
  | "debug:info"
  | "debug:warn"
  | "debug:error";
/**
 * Do not use color in console output
 */
export type LogNoColorsConfig = boolean;
/**
 * Show timestamps in console output
 */
export type LogTimestampConfig = boolean;
/**
 * Add long stack traces to log entries. Recommended for debugging only.
 */
export type LongStacktraceConfig = boolean;
/**
 * Do not check that needed files are readable and/or writable
 */
export type NoPermsCheckConfig = boolean;
/**
 * Path to configuration JSON file to register Appium as a node with Selenium Grid 3; otherwise the configuration itself
 */
export type NodeconfigConfig =
  | {
      [k: string]: unknown;
    }
  | string;
/**
 * A list of plugins to activate. To activate all plugins, use the single string "all". If a string, can otherwise be valid JSON.
 */
export type PluginsConfig = string | string[];
/**
 * Port to listen on
 */
export type PortConfig = number;
/**
 * Disable additional security checks, so it is possible to use some advanced features, provided by drivers supporting this option. Only enable it if all the clients are in the trusted network and it's not the case if a client could potentially break out of the session sandbox. Specific features can be overridden by using "deny-insecure"
 */
export type RelaxedSecurityConfig = boolean;
/**
 * Enables session override (clobbering)
 */
export type SessionOverrideConfig = boolean;
/**
 * Cause sessions to fail if desired caps are sent in that Appium does not recognize as valid for the selected device
 */
export type StrictCapsConfig = boolean;
/**
 * Absolute path to directory Appium can use to manage temp files. Defaults to C:\Windows\Temp on Windows and /tmp otherwise.
 */
export type TmpConfig = string;
/**
 * Absolute path to directory Appium can use to save iOS instrument traces; defaults to <tmp>/appium-instruments
 */
export type TraceDirConfig = string;
/**
 * Also send log output to this http listener
 */
export type WebhookConfig = string;

/**
 * A schema for Appium configuration files
 */
export interface AppiumConfiguration {
  server?: ServerConfig;
  driver?: DriverConfig;
  plugin?: PluginConfig;
}
/**
 * Configuration when running Appium as a server
 */
export interface ServerConfig {
  address?: AddressConfig;
  "allow-cors"?: AllowCorsConfig;
  "allow-insecure"?: AllowInsecureConfig;
  "base-path"?: BasePathConfig;
  "callback-address"?: CallbackAddressConfig;
  "callback-port"?: CallbackPortConfig;
  "debug-log-spacing"?: DebugLogSpacingConfig;
  "default-capabilities"?: DefaultCapabilitiesConfig;
  "deny-insecure"?: DenyInsecureConfig;
  drivers?: DriversConfig;
  "keep-alive-timeout"?: KeepAliveTimeoutConfig;
  "local-timezone"?: LocalTimezoneConfig;
  log?: LogConfig;
  "log-filters"?: LogFiltersConfig;
  "log-level"?: LogLevelConfig;
  "log-no-colors"?: LogNoColorsConfig;
  "log-timestamp"?: LogTimestampConfig;
  "long-stacktrace"?: LongStacktraceConfig;
  "no-perms-check"?: NoPermsCheckConfig;
  nodeconfig?: NodeconfigConfig;
  plugins?: PluginsConfig;
  port?: PortConfig;
  "relaxed-security"?: RelaxedSecurityConfig;
  "session-override"?: SessionOverrideConfig;
  "strict-caps"?: StrictCapsConfig;
  tmp?: TmpConfig;
  "trace-dir"?: TraceDirConfig;
  webhook?: WebhookConfig;
}
/**
 * Driver-specific configuration. Keys should correspond to driver package names
 */
export interface DriverConfig {
  [k: string]: unknown;
}
/**
 * Plugin-specific configuration. Keys should correspond to plugin package names
 */
export interface PluginConfig {
  [k: string]: unknown;
}
