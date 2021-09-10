import { ResolverService } from '../service/local-resolver';
import { LoggerService } from '../service/logger';
import { LocalServer } from '../local-server';
import { ConfigService } from '../service/config';

export async function startLocalServer(
  log: LoggerService,
  resolver: ResolverService,
  config: ConfigService
) {
  const localServer = new LocalServer(log, resolver);
  const server = await localServer.start(config.get('serverDefaults'));
}

startLocalServer.command = 'appium.startLocalServer';
