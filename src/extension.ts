import { commands, Disposable, ExtensionContext } from 'vscode';
import { ServerEditorProvider } from './editor/server-editor';
import { ConfigService } from './service/config';
import { LoggerService } from './service/logger';
import { AppiumTreeDataProvider } from './view/tree-data-provider';
import { AppiumTaskProvider } from './task/task-provider';
import { ServerConfigBusService } from './server-config-bus';
import { showOutput } from './commands/show-output';
import { startLocalServer } from './commands/start-local-server';

const disposables: Disposable[] = [];
let log: LoggerService;

export function activate(ctx: ExtensionContext) {
  log = LoggerService.get(ctx);
  const config = ConfigService.get();
  const serverConfigBus = ServerConfigBusService.get();

  disposables.push(
    ...AppiumTaskProvider.register(),
    ...AppiumTreeDataProvider.register(),
    ...ServerEditorProvider.register(ctx),
    commands.registerCommand(startLocalServer.command, () => {
      startLocalServer();
    }),
    commands.registerCommand(showOutput.command, () => {
      showOutput();
    }),
    serverConfigBus,
    config,
    log
  );

  ctx.subscriptions.push(...disposables);

  log.info('Activated %s from %s', ctx.extension.id, ctx.extensionPath);
}

// this method is called when your extension is deactivated
export function deactivate() {
  log.info('Disposing Appium extension. Bye!');
  disposables.forEach((disposable) => disposable.dispose());
}
