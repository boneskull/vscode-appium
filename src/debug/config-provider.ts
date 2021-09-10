import {
  window,
  CancellationToken,
  DebugConfiguration,
  DebugConfigurationProvider,
  WorkspaceFolder,
} from 'vscode';
import { showErrorMessage } from '../errors';
import { LoggerService } from '../service/logger';

interface AppiumDebugConfiguration extends DebugConfiguration {
  program: string;
}

export class AppiumDebugConfigProvider implements DebugConfigurationProvider {
  static readonly debugType = 'appium';

  constructor(private log: LoggerService) {}

  public static isAppiumDebugConfiguration(
    config: any
  ): config is AppiumDebugConfiguration {
    return (
      AppiumDebugConfigProvider.isDebugConfiguration(config) && config.program
    );
  }

  public static isDebugConfiguration(
    config: any
  ): config is DebugConfiguration {
    return (
      config &&
      typeof config === 'object' &&
      config.type &&
      config.request &&
      config.name
    );
  }

  public async resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    token?: CancellationToken
  ): Promise<DebugConfiguration | undefined> {
    if (token?.isCancellationRequested) {
      return;
    }

    // check if the config exists at all, and provide defaults if not.
    // if the config does exist but

    if (!AppiumDebugConfigProvider.isDebugConfiguration(config)) {
      if (window.activeTextEditor) {
        return {
          type: AppiumDebugConfigProvider.debugType,
          name: 'Launch',
          request: 'launch',
          program: '${file}',
          stopOnEntry: true,
        };
      }
    }
    if (!config.program) {
      await showErrorMessage(
        'Appium debug configuration missing `program` property. Please check your `launch.json` file.'
      );
      return;
    }

    return config;
  }
}
