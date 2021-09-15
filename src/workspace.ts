import { window, workspace } from 'vscode';

export function getCurrentWorkspaceFolderUri() {
  const textEditor = window.activeTextEditor;
  if (!textEditor) {
    return workspace.workspaceFolders?.[0]?.uri;
  }
  const { document } = textEditor;
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
  return workspaceFolder?.uri;
}
