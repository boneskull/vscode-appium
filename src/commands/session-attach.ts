// import { ExtensionContext, window, WorkspaceConfiguration } from 'vscode';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';
// import { RunningSessionsService } from '../server';
// import { SessionAttachService } from '../session-attach-service';

export async function attachToSession(
  log: LoggerService,
  config: ConfigService
) {
  // log.debug('instantiating a RunningSessionsService with opts %O', config);
  // const runningSessions = new RunningSessionsService(log);
  // const sessions = await runningSessions.list(config.get('sessionDefaults'));
  // log.debug('sessions: %O', sessions);
  // window.showQuickPick(sessions, { title: 'Select a session to attach to' });
  // const sessionId = await window.showInputBox({
  //   title: 'Appium Session ID',
  //   prompt: 'Enter ID of running session',
  //   validateInput: (value) =>
  //     value.length ? null : 'Session ID cannot be blank',
  // });
  // if (sessionId) {
  //   const session = new SessionAttachService({ sessionId, capabilities: {} });
  //   session.attach();
  // }
}

attachToSession.command = 'appium.attachToSession';
