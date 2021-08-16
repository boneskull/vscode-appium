import {workspace} from 'vscode';
import {getCurrentWorkspaceFolderUri} from './workspace';

const CONFIG_NAMESPACE = 'appium';

export function getConfig(uri = getCurrentWorkspaceFolderUri()) {
  return workspace.getConfiguration(CONFIG_NAMESPACE, uri);
}
