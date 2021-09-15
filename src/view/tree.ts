import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
import { AppiumTreeDataProvider } from './tree-data-provider';
import {
  Disposable,
  ExtensionContext,
  Position,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { commands } from 'vscode';
import { screenshot } from '../commands/screenshot';
import path from 'path';
import { getCurrentWorkspaceFolderUri } from '../workspace';

export function initTreeView(
  log: LoggerService,
  config: ConfigService,
  ctx: ExtensionContext
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
    ),
    commands.registerCommand(
      'appium.screenshot',
      async ({ serverNickname, id }: AppiumSession) => {
        if (treeDataProvider.hasServer(serverNickname)) {
          const server = treeDataProvider.getServer(serverNickname)!;
          return screenshot(log, server, id);
        } else {
          log.error(
            'Session missing server reference, or server does not exist'
          );
        }
      }
    ),

    commands.registerCommand('appium.addServer', async () => {
      // try to put new file in .vscode
      log.debug('Command: appium.addServer');
      const rootUri = getCurrentWorkspaceFolderUri();
      if (rootUri) {
        try {
          const dirUri = Uri.file(path.join(rootUri.fsPath, '.vscode'));
          await workspace.fs.createDirectory(dirUri);

          let filepath = path.join(dirUri.fsPath, 'new-server.appiumserver');
          let newFileUri = Uri.file(filepath).with({ scheme: 'untitled' });
          await workspace.openTextDocument(newFileUri);
          const edit = new WorkspaceEdit();

          if (!edit.has(newFileUri)) {
            edit.insert(newFileUri, new Position(0, 0), '{}');
            await workspace.applyEdit(edit);
          }

          // Actually show the editor
          await commands.executeCommand('vscode.open', newFileUri);
        } catch (err) {
          log.error(<Error>err);
        }
      }
    })
  );

  return disposables;
}
