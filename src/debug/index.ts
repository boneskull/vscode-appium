import { debug, Disposable } from 'vscode';
import { ConfigService } from '../service/config';
import { ResolverService } from '../service/local-resolver';
import { LoggerService } from '../service/logger';
import { AppiumDebugConfigProvider } from './config-provider';

export function registerDebuggers(
  log: LoggerService,
  resolver: ResolverService,
  config: ConfigService
): Disposable[] {
  return [
    debug.registerDebugConfigurationProvider(
      AppiumDebugConfigProvider.debugType,
      new AppiumDebugConfigProvider(log)
    ),
  ];
}
