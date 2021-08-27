import { ResolverService } from '../resolver-service';
import { LoggerService } from '../logger-service';
import { LocalServerService } from '../local-server-service';
import { getConfig } from '../config';

export async function startLocalServer(
  log: LoggerService,
  resolver: ResolverService,
  localServer: LocalServerService
) {
  const executable = await resolver.resolve();
  const server = await localServer.start(
    executable,
    getConfig('serverDefaults')
  );
}
