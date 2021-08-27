import {
  commands,
  workspace,
  Disposable,
  ExtensionContext,
  tasks,
} from 'vscode';
import { startLocalServer } from './commands/start-local-server';
import { LocalServerService } from './local-server-service';
import { LoggerService } from './logger-service';
import { ResolverService } from './resolver-service';
import { attachToSession } from './commands/session-attach';
import { AppiumTaskProvider } from './appium-task-provider';

let disposables: Disposable[] = [];
let log: LoggerService;

export function activate(ctx: ExtensionContext) {
  // I'm not sure if this is neccessary, but it's here just in case
  if (!workspace.workspaceFolders || !workspace.workspaceFolders.length) {
    return;
  }

  log = new LoggerService();
  const resolver = new ResolverService(log);
  const localServer = new LocalServerService(log);

  log.info('Starting Appium extension');

  disposables = [
    tasks.registerTaskProvider(
      AppiumTaskProvider.taskType,
      new AppiumTaskProvider(log, resolver)
    ),
    commands.registerCommand('appium.startLocalServer', () => {
      startLocalServer(log, resolver, localServer);
    }),
    commands.registerCommand('appium.showOutput', () => {
      log.show();
    }),
    commands.registerCommand('appium.attachToSession', () => {
      attachToSession(log);
    }),
    localServer,
    log,
  ];

  ctx.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {
  log.info('Disposing Appium extension');
  for (let disposable of disposables) {
    disposable.dispose();
  }
  log.dispose();
}
