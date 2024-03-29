import {
  TaskProvider,
  Task,
  CancellationToken,
  TaskDefinition,
  TaskScope,
  CustomExecution,
  Disposable,
  WorkspaceFolder,
  tasks,
} from 'vscode';
import { AppiumPseudoterminal } from '../pty';
import { ConfigService } from '../service/config';
import { APPIUM_SERVER_TASK_TYPE } from '../constants';
import { LoggerService } from '../service/logger';
import { ResolverService } from '../service/local-resolver';

type AppiumTaskDefinition = AppiumLocalServerConfig & TaskDefinition;

export class AppiumTaskProvider implements TaskProvider, Disposable {
  /**
   * Default task label
   */
  private static readonly label = 'Start Appium Server';
  /**
   * Task source
   */
  private static readonly source = 'appium';

  /**
   * The task type. This will be used to register the task provider.
   */
  static readonly taskType = APPIUM_SERVER_TASK_TYPE;

  private constructor() {}

  private readonly log = LoggerService.get();
  private readonly config = ConfigService.get();
  private readonly resolver = ResolverService.get();

  public static register() {
    return [
      tasks.registerTaskProvider(
        AppiumTaskProvider.taskType,
        new AppiumTaskProvider()
      ),
    ];
  }

  public dispose() {
    // TODO: should we save and dispose the pty?
  }

  public async provideTasks(token: CancellationToken): Promise<Task[]> {
    if (token.isCancellationRequested) {
      this.log.debug('Canceling provideTasks() call');
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

    const config = ConfigService.compact(this.config.get('serverDefaults'));

    return [
      this.createTask(definition, executable, {
        ...config,
        ...definition,
      }),
    ];
  }

  public async resolveTask(
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

    const config = ConfigService.compact(this.config.get('serverDefaults'));

    return this.createTask(
      definition,
      executable,
      { ...config, ...definition },
      task.scope
    );
  }

  /**
   * Creates a {@link CustomExecution} task using {@link AppiumPseudoterminal}
   * @param executable - Contains path to `appium` executable
   * @param config - Contains configuration for the task.
   */
  private createCustomExecution(
    executable: AppiumExecutable,
    config: AppiumLocalServerConfig
  ): CustomExecution {
    return new CustomExecution(
      async (): Promise<AppiumPseudoterminal> =>
        new AppiumPseudoterminal(this.log, executable, config)
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
    config: AppiumLocalServerConfig,
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
