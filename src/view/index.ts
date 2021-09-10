import { Disposable } from 'vscode';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
import { initTreeView } from './tree';

export function registerViews(
  log: LoggerService,
  config: ConfigService
): Disposable[] {
  return [...initTreeView(log, config)];
}
