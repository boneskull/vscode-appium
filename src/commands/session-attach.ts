import { ExtensionContext, window, WorkspaceConfiguration } from 'vscode';
import { getConfig } from '../config';
import { LoggerService } from '../logger-service';
import { RunningSessionsService } from '../running-sessions-service';
import { SessionAttachService } from '../session-attach-service';

export async function attachToSession(log: LoggerService) {
  const config = getConfig('sessionDefaults');

  log.debug('instantiating a RunningSessionsService with opts %O', config);
  const runningSessions = new RunningSessionsService(log, config);

  const sessions = await runningSessions.list();
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
