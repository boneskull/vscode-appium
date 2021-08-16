import { ResolverService } from "../resolver-service";
import { LoggerService } from "../logger-service";
import { LocalServerService } from "../local-server-service";

export async function startLocalServer(
  log: LoggerService,
  resolver: ResolverService,
  localServer: LocalServerService
) {
  const executable = await resolver.resolve();
  await localServer.start(executable);
}
