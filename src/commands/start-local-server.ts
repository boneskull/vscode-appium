import { ResolverService } from '../resolver-service';
import { LoggerService } from '../logger-service';
import { LocalServerService } from '../local-server-service';
import { ConfigService } from '../config-service';

export async function startLocalServer(
  log: LoggerService,
  resolver: ResolverService,
  localServer: LocalServerService,
  config: ConfigService
) {
  const executable = await resolver.resolve();
  const server = await localServer.start(
    executable,
    config.get('serverDefaults')
  );
}
