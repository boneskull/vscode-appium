import {commands, workspace, Disposable, ExtensionContext, tasks} from 'vscode';
import {startLocalServer} from './commands/start-local-server';
import {getConfig} from './config';
import {LocalServerService} from './local-server-service';
import {LoggerService} from './logger-service';
import {ResolverService} from './resolver-service';
import {AppiumTaskProvider} from './task';
import {getCurrentWorkspaceFolderUri} from './workspace';

let disposables: Disposable[] = [];
let log: LoggerService;

export function activate(ctx: ExtensionContext) {
  // I'm not sure if this is neccessary, but it's here just in case
  if (!workspace.workspaceFolders || !workspace.workspaceFolders.length) {
    return;
  }

  const config = getConfig(getCurrentWorkspaceFolderUri());
  log = new LoggerService();
  const resolver = new ResolverService(log);
  const localServer = new LocalServerService(log);

  log.info('Starting Appium extension');

  disposables = [
    tasks.registerTaskProvider(
      AppiumTaskProvider.taskType,
      new AppiumTaskProvider(log, resolver),
    ),
    commands.registerCommand('appium.startLocalServer', () => {
      startLocalServer(log, resolver, localServer);
    }),
    commands.registerCommand('appium.showOutput', () => {
      log.show();
    }),
    commands.registerCommand('appium.createStartServerTask', () => {}),
    localServer,
    log,
  ];

  ctx.subscriptions.push(...disposables);
  // newSession(ctx);

  // // The command has been defined in the package.json file
  // // Now provide the implementation of the command with  registerCommand
  // // The commandId parameter must match the command field in package.json
  // let disposable = vscode.commands.registerCommand(
  //   'vscode-appium.helloWorld',
  //   function () {
  //     // The code you place here will be executed every time your command is executed

  //     // Display a message box to the user
  //     vscode.window.showInformationMessage(
  //       'Hello World from Appium for VS Code!',
  //     );
  //   },
  // );

  // ctx.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  log.info('Disposing Appium extension');
  for (let disposable of disposables) {
    disposable.dispose();
  }
}
