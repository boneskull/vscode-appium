// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {newSession} from './commands/new-session';
import {AppiumTaskProvider} from './task';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let appiumTaskProvider: vscode.Disposable | undefined;

export function activate(ctx: vscode.ExtensionContext) {
  // I'm not sure if this is neccessary, but it's here just in case
  if (
    !vscode.workspace.workspaceFolders ||
    !vscode.workspace.workspaceFolders.length
  ) {
    return;
  }

  appiumTaskProvider = vscode.tasks.registerTaskProvider(
    AppiumTaskProvider.taskType,
    new AppiumTaskProvider(),
  );

  ctx.subscriptions.push(appiumTaskProvider);

  // newSession(ctx);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'vscode-appium.helloWorld',
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Hello World from Appium for VS Code!',
      );
    },
  );

  ctx.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (appiumTaskProvider) {
    appiumTaskProvider.dispose();
  }
}
