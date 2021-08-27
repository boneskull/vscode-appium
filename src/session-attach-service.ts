import { Disposable } from 'vscode';
import { AttachOptions, attach } from 'webdriverio';
import { assign, createMachine, interpret, Interpreter } from 'xstate';
import { LoggerService } from './logger-service';

type SessionAttachOptions = AttachOptions;
type SessionDriver = WebdriverIO.Browser;

export async function attachToSession(opts: SessionAttachOptions) {
  return attach(opts);
}

export async function detachFromSession(driver: SessionDriver) {
  return driver.deleteSession();
}

type SessionAttachEvent = { type: 'ATTACH' } | { type: 'DETACH' };

type SessionAttachTypestate =
  | {
      value: 'idle';
      context: SessionAttachContext & { error: undefined; session: undefined };
    }
  | {
      value: 'attaching';
      context: SessionAttachContext & { error: undefined; session: undefined };
    }
  | {
      value: 'attached';
      context: SessionAttachContext & {
        error: undefined;
        session: WebdriverIO.Browser;
      };
    }
  | {
      value: 'detaching';
      context: SessionAttachContext & {
        error: undefined;
        session: WebdriverIO.Browser;
      };
    }
  | {
      value: 'detached';
      context: SessionAttachContext & { error: undefined; session: undefined };
    };

interface SessionAttachContext {
  error?: Error;
  opts: SessionAttachOptions;
  session?: WebdriverIO.Browser;
}

export class SessionAttachService implements Disposable {
  protected log: LoggerService;
  protected service: Interpreter<
    SessionAttachContext,
    any,
    SessionAttachEvent,
    SessionAttachTypestate
  >;

  constructor(log: LoggerService, opts: SessionAttachOptions) {
    this.log = log;
    const machine = createMachine<
      SessionAttachContext,
      SessionAttachEvent,
      SessionAttachTypestate
    >(
      {
        id: 'session-attach',
        context: { opts },
        initial: 'idle',
        states: {
          idle: {
            on: {
              ATTACH: 'attaching',
            },
            exit: ['reset'],
          },
          attaching: {
            invoke: {
              id: 'attach',
              src: 'attach',
              onDone: {
                target: 'attached',
                actions: assign({ session: (ctx, event) => event.data }),
              },
              onError: {
                target: 'failed',
              },
            },
          },
          attached: {
            on: {
              DETACH: 'detaching',
            },
          },
          detaching: {
            invoke: {
              id: 'detach',
              src: 'detach',
              onDone: {
                target: 'idle',
                actions: ['reset'],
              },
              onError: {
                target: 'failed',
              },
            },
          },
          failed: {
            on: {
              ATTACH: 'attaching',
            },
          },
        },
      },
      {
        actions: {
          reset: assign((ctx) => ({ error: undefined, session: undefined })),
        },
        services: {
          attach: async (ctx) => attachToSession(ctx.opts),
          detach: async (ctx) => {
            if (ctx.session) {
              return detachFromSession(ctx.session);
            }
          },
        },
      }
    );

    this.service = interpret(machine).onTransition((ctx, event) => {
      this.log.debug(ctx.value);
    });

    this.service.start();
  }

  public attach() {
    this.service.send({ type: 'ATTACH' });
  }

  public detach() {
    this.service.send({ type: 'DETACH' });
  }

  public dispose() {
    this.service.stop();
  }
}
