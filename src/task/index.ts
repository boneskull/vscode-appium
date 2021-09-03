import { Disposable, tasks } from 'vscode';
import { ConfigService } from '../service/config';
import { ResolverService } from '../service/local-resolver';
import { LoggerService } from '../service/logger';
import { AppiumTaskProvider } from './task-provider';

export function registerTasks(
  log: LoggerService,
  resolver: ResolverService,
  config: ConfigService
): Disposable[] {
  return [
    tasks.registerTaskProvider(
      AppiumTaskProvider.taskType,
      new AppiumTaskProvider(log, resolver, config)
    ),
  ];
}
