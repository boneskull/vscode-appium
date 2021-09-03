import { ResolverService } from '../service/local-resolver';
import { LoggerService } from '../service/logger';
import { LocalServer } from '../local-server';
import { ConfigService } from '../service/config';

export async function startLocalServer(
  log: LoggerService,
  resolver: ResolverService,
  config: ConfigService
) {
  const executable = await resolver.resolve();
  const localServer = new LocalServer(log);
  const server = localServer.start(executable, config.get('serverDefaults'));
}

startLocalServer.command = 'appium.startLocalServer';
