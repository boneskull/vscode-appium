import * as vscode from 'vscode';

export interface AppiumTaskDefinition extends vscode.TaskDefinition {
  address: string;
  port: number;
  appiumHome: string;
  drivers: string[];
  plugins: string[];
  extraArgs: string[];
  program: string;
}

export class AppiumTaskProvider implements vscode.TaskProvider {
  static taskType = 'appium';

  private appiumTaskPromise: Promise<vscode.Task[]> | undefined;

  provideTasks(
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Task[]> {
    if (!this.appiumTaskPromise) {
      this.appiumTaskPromise = this.findTasks();
    }
    return this.appiumTaskPromise;
  }
  resolveTask(
    task: vscode.Task,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Task> {
    if (task) {
      const definition = task.definition as AppiumTaskDefinition;
      return new vscode.Task(
        definition,
        task.scope ?? vscode.TaskScope.Workspace,
        definition.task,
        'appium',
        new vscode.ProcessExecution(definition.program, definition.extraArgs),
      );
    }
  }

  private async findTasks() {
    return (vscode.workspace.workspaceFolders ?? [])
      .filter(({uri}) => Boolean(uri.fsPath))
      .map(
        (workspaceFolder) =>
          new vscode.Task(
            {type: 'appium', task: 'Start Server'},
            workspaceFolder,
            'Start Server',
            'appium',
            new vscode.ProcessExecution(
              '/Users/chrishiller/projects/appium/packages/appium/build/lib/main.js',
              ['server'],
            ),
          ),
      );
  }
}
