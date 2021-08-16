import {window, workspace} from 'vscode';

export function getCurrentWorkspaceFolderUri() {
  const textEditor = window.activeTextEditor;
  if (!textEditor) {
    return;
  }
  const {document} = textEditor;
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return;
  }
  return workspaceFolder.uri;
}
