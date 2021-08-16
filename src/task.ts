import {
  TaskDefinition,
  TaskProvider,
  Task,
  CancellationToken,
  ProcessExecution,
  ProviderResult,
  TaskScope,
  workspace,
} from 'vscode';
import {LoggerService} from './logger-service';
import {ResolverService} from './resolver-service';

export interface AppiumTaskDefinition extends TaskDefinition {
  address: string;
  port: number;
  appiumHome: string;
  drivers: string[];
  plugins: string[];
  extraArgs: string[];
  program: string;
}

export class AppiumTaskProvider implements TaskProvider {
  static taskType = 'appium';
  private appiumTaskPromise: Promise<Task[]> | undefined;

  constructor(private log: LoggerService, private resolver: ResolverService) {}

  public provideTasks(token: CancellationToken): ProviderResult<Task[]> {
    if (!this.appiumTaskPromise) {
      this.appiumTaskPromise = this.findTasks();
    }
    return this.appiumTaskPromise;
  }

  public resolveTask(
    task: Task,
    token: CancellationToken,
  ): ProviderResult<Task> {
    if (task) {
      const definition = task.definition as AppiumTaskDefinition;
      return new Task(
        definition,
        task.scope ?? TaskScope.Workspace,
        definition.task,
        'appium',
        new ProcessExecution(definition.program, definition.extraArgs),
      );
    }
  }

  private async findTasks() {
    const {path: executablePath, version} = await this.resolver.resolve();
    const command = version.startsWith('1')
      ? executablePath
      : `${executablePath} server`;
    return (workspace.workspaceFolders ?? [])
      .filter(({uri}) => Boolean(uri.fsPath))
      .map((workspaceFolder) => {
        return new Task(
          {type: 'appium', task: 'Start Server'},
          workspaceFolder,
          'Start Server',
          'appium',
          new ProcessExecution(command),
        );
      });
  }
}
