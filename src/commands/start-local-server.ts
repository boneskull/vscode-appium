import { ResolverService } from '../service/local-resolver';
import { LoggerService } from '../service/logger';
import { LocalServer } from '../local-server';
import { ConfigService } from '../service/config';

export async function startLocalServer() {
  const localServer = new LocalServer(
    LoggerService.get(),
    ResolverService.get()
  );
  await localServer.start(ConfigService.get().get('serverDefaults'));
}

startLocalServer.command = 'appium.startLocalServer';
