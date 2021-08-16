import {Disposable, window} from 'vscode';
import {format as printf} from 'util';
import {OUTPUT_CHANNEL_NAME} from './constants';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  QUIET,
}

type LogLevelString = keyof typeof LogLevel;

const HR_LOGLEVEL: LogLevelString[] = [
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'QUIET',
];

export class LoggerService implements Disposable {
  private outputChannel = window.createOutputChannel(OUTPUT_CHANNEL_NAME);

  private _logLevel: LogLevel = LogLevel.DEBUG;

  public get logLevel() {
    return this._logLevel;
  }

  public set logLevel(value: LogLevel) {
    this._logLevel = value;
  }

  /**
   * Instantiate with a log level, if desired
   */
  constructor(logLevel?: LogLevel | LogLevelString) {
    if (typeof logLevel === 'string') {
      this.logLevel = LogLevel[logLevel];
    } else if (typeof logLevel === 'number') {
      this.logLevel = logLevel;
    }
  }

  /**
   * Append messages to the output channel and format it with a title
   */
  public debug(...args: any[]) {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.writeLog(LogLevel.DEBUG, ...args);
    }
  }

  /**
   * Util function to format printf-style
   */
  public format(...args: any[]) {
    return printf(...args);
  }

  /**
   * Append messages to the output channel and format it with a title
   */
  public info(...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.writeLog(LogLevel.INFO, ...args);
    }
  }

  /**
   * Append messages to the output channel and format it with a title
   */
  public warn(...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.writeLog(LogLevel.WARN, ...args);
    }
  }

  /**
   * Logs an exception. If it's a proper `Error`, nicely format the message and dump the stack.
   * Otherwise, just dump or write raw if `string`.
   */
  public error(error: Error | string) {
    if (this.logLevel <= LogLevel.ERROR) {
      if (typeof error === 'string') {
        // Errors as a string usually only happen with
        // plugins that don't return the expected error.
        this.write(error);
      } else if (error?.message || error?.stack) {
        if (error?.message) {
          this.writeLog(LogLevel.ERROR, error.message);
        }
        if (error?.stack) {
          this.write(error.stack);
        }
      } else {
        this.dir(error);
      }
    }
  }

  /**
   * Shows the output channel
   */
  public show() {
    this.outputChannel.show();
  }

  /**
   * Object dumper; only visible at DEBUG level.
   */
  private dir(data: any) {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.write(this.format('%O', data));
    }
  }

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param logLevel - The log level the message originates from
   * @param args - Set of printf-style args to be formatted
   */
  private writeLog(logLevel: LogLevel, ...args: any[]) {
    this.write(
      this.format(
        '%s [%s] %s',
        HR_LOGLEVEL[logLevel],
        new Date().toLocaleTimeString(),
        this.format(...args),
      ),
    );
  }

  /**
   * Convenience to write directly to the output channel
   */
  private write(message: string) {
    this.outputChannel.appendLine(message);
  }

  /**
   * Disposes the output channel
   */
  public dispose() {
    this.outputChannel.dispose();
  }
}
