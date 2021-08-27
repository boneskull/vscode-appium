import { jsonRequest } from './request';
import { createMachine, assign, interpret, Interpreter } from 'xstate';
import { LoggerService } from './logger-service';
import { RequestError } from 'got';

type RunningSessionsEvent =
  | { type: 'list' }
  | { type: 'failed'; error: RequestError };

type RunningSessionsTypestate =
  | {
      value: 'idle';
      context: RunningSessionsContext & { sessionIds: undefined };
    }
  | {
      value: 'listing';
      context: RunningSessionsContext & { sessionIds: undefined };
    }
  | {
      value: 'listed';
      context: RunningSessionsContext & { sessionIds: Set<string> };
    };

interface RunningSessionsContext {
  opts: AppiumSessionConfig;
  sessionIds?: Set<string>;
}

export class RunningSessionsService {
  private log: LoggerService;

  protected service: Interpreter<
    RunningSessionsContext,
    any,
    RunningSessionsEvent,
    RunningSessionsTypestate
  >;

  protected static async requestRunningSessions(
    ctx: RunningSessionsContext
  ): Promise<Set<string>> {
    const result = await jsonRequest<AppiumSessionsResponse>(
      ctx.opts,
      'sessions'
    );
    if (result.ok) {
      return new Set(result.val.value.map((s) => s.id));
    }
    throw result.val;
  }

  constructor(log: LoggerService, opts: AppiumSessionConfig) {
    this.log = log;

    opts.pathname =
      opts.pathname ?? opts.remoteAppiumVersion === '1.x' ? '/wd/hub' : '';

    const machine = this.createMachine(opts);
    this.service = interpret(machine).onTransition((ctx, event) => {
      this.log.debug(`TRANSITION: ${event.type}: ${JSON.stringify(ctx.value)}`);
    });

    this.service.start();
    this.log.debug('Started RunningSessionsService');
  }

  public dispose() {
    this.service.stop();
  }

  private createMachine(opts: AppiumSessionConfig) {
    return createMachine<
      RunningSessionsContext,
      RunningSessionsEvent,
      RunningSessionsTypestate
    >(
      {
        id: 'running-sessions',
        initial: 'idle',
        context: { sessionIds: undefined, opts },
        states: {
          idle: {
            on: {
              list: 'listing',
            },
            exit: ['reset'],
          },
          listing: {
            invoke: {
              id: 'list',
              src: RunningSessionsService.requestRunningSessions,
              onDone: {
                target: 'listed',
                actions: assign({ sessionIds: (ctx, event) => event.data }),
              },
              onError: {
                target: 'failed',
              },
            },
          },
          listed: {
            type: 'final',
          },
          failed: {
            type: 'final',
            // TODO: instead of this action, we should pop up an error notification
            entry: ['logError'],
          },
        },
      },
      {
        actions: {
          reset: assign({ sessionIds: (ctx) => undefined }),
          logError: (ctx, event) => {
            if (event.type === 'failed') {
              this.log.error(event.error);
            }
          },
        },
      }
    );
  }

  public async list() {
    return new Promise((resolve, reject) => {
      this.service.send('list');
      this.service.onDone((event) => {
        resolve(event.data);
      });
    });
  }
}
