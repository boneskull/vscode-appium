import { commands, Disposable, ExtensionContext, tasks } from 'vscode';
import { startLocalServer } from './commands/start-local-server';
import { LocalServerService } from './local-server-service';
import { LoggerService } from './logger-service';
import { ResolverService } from './resolver-service';
import { attachToSession } from './commands/session-attach';
import { AppiumTaskProvider } from './appium-task-provider';
import { ConfigService } from './config-service';
import { showOutput } from './commands/show-output';

const disposables: Disposable[] = [];
let log: LoggerService;

export function activate(ctx: ExtensionContext) {
  log = new LoggerService(ctx);
  const resolver = new ResolverService(log);
  const localServer = new LocalServerService(log);
  const config = new ConfigService(log);

  disposables.push(
    tasks.registerTaskProvider(
      AppiumTaskProvider.taskType,
      new AppiumTaskProvider(log, resolver, config)
    ),
    commands.registerCommand(startLocalServer.command, () => {
      startLocalServer(log, resolver, localServer, config);
    }),
    commands.registerCommand(showOutput.command, () => {
      showOutput(log);
    }),
    commands.registerCommand(attachToSession.command, () => {
      attachToSession(log, config);
    }),
    localServer,
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
