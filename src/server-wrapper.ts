/// <reference types="./types/global"/>

/**
 * A process started over IPC, which ensures these two functions are non-null
 * @todo The type of `message` should be {@link AppiumIPCMessage}.
 */
type IPCProcess = NodeJS.Process & {
  send(
    message: any,
    sendHandle?: any,
    options?: { swallowErrors?: boolean },
    callback?: (error: Error | null) => void
  ): boolean;
  disconnect(): void;
};

type AppiumIPCCommandMessageListener = (message: AppiumIPCCommand) => any;

function onMessage(listener: AppiumIPCCommandMessageListener) {
  process.on('message', listener);
}

export async function main() {
  if (!process.connected) {
    throw new Error('must be run as IPC process');
  }
  const args = process.argv.slice(2);
  const modulePath = args[0];

  const proc = <IPCProcess>process;

  if (modulePath) {
    const { main: appium } = await import(modulePath);

    onMessage(async (message) => {
      switch (message.command) {
        case 'start':
          const { args } = message;
          console.log(
            'received "start" command; attempting to start appium on %s:%s',
            args.address,
            args.port
          );
          args.appiumHome = args.appiumHome || process.env.APPIUM_HOME;
          await appium(args);
          proc.send({
            type: 'started',
            details: { address: args.address, port: args.port },
          });
          break;
        default:
          const _exhaustiveCheck: never = message.command;
          return _exhaustiveCheck;
      }
    });
    proc.send({ type: 'ready' });
  } else {
    proc.send({ type: 'fail', reason: 'No module path provided' });
    process.disconnect();
  }
}

if (require.main === module) {
  main();
}
