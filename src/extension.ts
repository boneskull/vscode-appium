import { Disposable, ExtensionContext } from 'vscode';
import { registerContextFreeCommands } from './commands';
import { ServerEditorProvider } from './editor/server-editor';
import { ConfigService } from './service/config';
import { ResolverService } from './service/local-resolver';
import { LoggerService } from './service/logger';
import { registerTasks } from './task';
import { registerViews } from './view';

const disposables: Disposable[] = [];
let log: LoggerService;

export function activate(ctx: ExtensionContext) {
  log = LoggerService.get(ctx);
  const resolver = new ResolverService(log);
  const config = ConfigService.get();

  disposables.push(
    ...registerTasks(log, resolver, config),
    ...registerContextFreeCommands(log, resolver, config),
    ...registerViews(log, config, ctx),
    ServerEditorProvider.register(ctx),
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
