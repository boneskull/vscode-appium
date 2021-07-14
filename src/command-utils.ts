import {commands, ExtensionContext} from 'vscode';

const EXTENSION_ID = 'vscode-appium';

export function register(
  ctx: ExtensionContext,
  name: string,
  func: (...args: any) => void,
) {
  const commandID = `${EXTENSION_ID}.${name}`;
  ctx.subscriptions.push(commands.registerCommand(commandID, func));
  return commandID;
}
