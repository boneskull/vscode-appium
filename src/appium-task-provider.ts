import {
  TaskProvider,
  Task,
  CancellationToken,
  TaskDefinition,
  TaskScope,
  CustomExecution,
  Disposable,
  WorkspaceFolder,
} from 'vscode';
import { AppiumPseudoterminal } from './appium-pty';
import { ConfigService } from './config-service';
import { APPIUM_SERVER_TASK_TYPE } from './constants';
import { LoggerService } from './logger-service';
import { ResolverService } from './resolver-service';

type AppiumTaskDefinition = AppiumServerConfig & TaskDefinition;

export class AppiumTaskProvider implements TaskProvider, Disposable {
  /**
   * The task type. This will be used to register the task provider.
   */
  static readonly taskType = APPIUM_SERVER_TASK_TYPE;

  /**
   * Default task label
   */
  private static readonly label = 'Start Appium Server';

  /**
   * Task source
   */
  private static readonly source = 'appium';

  constructor(
    private log: LoggerService,
    private resolver: ResolverService,
    private config: ConfigService
  ) {}

  async provideTasks(token: CancellationToken): Promise<Task[]> {
    if (token.isCancellationRequested) {
      return [];
    }

    const defaultConfigValues = {
      address: this.config.get('serverDefaults.address'),
      port: this.config.get('serverDefaults.port'),
      useBundledAppium: this.config.get('serverDefaults.useBundledAppium'),
    };

    const executable = await this.resolver.resolve({
      executablePath: this.config.get('serverDefaults.executablePath'),
      useBundledAppium: this.config.get('serverDefaults.useBundledAppium'),
    });

    const definition = {
      type: AppiumTaskProvider.taskType,
      label: AppiumTaskProvider.label,
      ...defaultConfigValues,
    };

    return [
      this.createTask(definition, executable, {
        ...this.config.get('serverDefaults'),
        ...definition,
      }),
    ];
  }

  /**
   * Creates a {@link CustomExecution} task using {@link AppiumPseudoterminal}
   * @param executable - Contains path to `appium` executable
   * @param config - Contains configuration for the task.
   */
  private createCustomExecution(
    executable: AppiumExecutable,
    config: AppiumServerConfig
  ) {
    return new CustomExecution(
      async (): Promise<AppiumPseudoterminal> =>
        new AppiumPseudoterminal(this.log, executable, config)
    );
  }

  public dispose() {
    // TODO: should we save and dispose the pty?
  }

  async resolveTask(
    task: Task,
    token: CancellationToken
  ): Promise<Task | undefined> {
    if (token.isCancellationRequested) {
      return;
    }

    const definition: AppiumTaskDefinition = <AppiumTaskDefinition>(
      task.definition
    );

    const executable = await this.resolver.resolve({
      executablePath: definition.executablePath,
      useBundledAppium: definition.useBundledAppium,
    });

    this.log.debug('Creating task with executable: %j', executable);

    return this.createTask(
      definition,
      executable,
      { ...this.config.get('serverDefaults'), ...definition },
      task.scope
    );
  }

  /**
   * Creates a {@link Task}, filling in defaults
   * @param definition - The user-provided or default task definition
   * @param executable - The resolved executable
   * @param config - The result of merging the definition with the default config
   * @param scope - The task scope
   */
  private createTask(
    definition: AppiumTaskDefinition,
    executable: AppiumExecutable,
    config: AppiumServerConfig,
    scope: WorkspaceFolder | TaskScope = TaskScope.Workspace
  ): Task {
    return new Task(
      definition,
      scope,
      AppiumTaskProvider.label,
      AppiumTaskProvider.source,
      this.createCustomExecution(executable, config)
    );
  }
}
