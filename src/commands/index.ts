import { commands, Disposable } from 'vscode';
import { startLocalServer } from './start-local-server';
import { showOutput } from './show-output';
import { attachToSession } from './session-attach';
import { LoggerService } from '../service/logger';
import { ResolverService } from '../service/local-resolver';
import { ConfigService } from '../service/config';

export function registerCommands(
  log: LoggerService,
  resolver: ResolverService,
  config: ConfigService
): Disposable[] {
  return [
    commands.registerCommand(startLocalServer.command, () => {
      startLocalServer(log, resolver, config);
    }),
    commands.registerCommand(showOutput.command, () => {
      showOutput(log);
    }),
    commands.registerCommand(attachToSession.command, () => {
      attachToSession(log, config);
    }),
  ];
}
