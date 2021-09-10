import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
import { AppiumTreeDataProvider } from './tree-data-provider';
import { Disposable, window } from 'vscode';
import { commands } from 'vscode';

export function initTreeView(
  log: LoggerService,
  config: ConfigService
): Disposable[] {
  const disposables = [];
  const treeDataProvider = new AppiumTreeDataProvider(log, config);

  disposables.push(
    window.createTreeView(AppiumTreeDataProvider.viewId, {
      treeDataProvider,
    }),
    commands.registerCommand('appium.refreshServers', () => {
      log.debug('Command: appium.refreshServers');
      treeDataProvider.refresh();
    }),
    commands.registerCommand(
      'appium.refreshServer',
      (item: AppiumServerInfo) => {
        log.debug('Command: appium.refreshServer - %s', item);
        treeDataProvider.refresh(item);
      }
    )
  );

  return disposables;
}
