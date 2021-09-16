import { Disposable, Uri, workspace } from 'vscode';

export function isServerInfo(value: any): value is AppiumServerInfo {
  return (
    value && typeof value === 'object' && 'host' in value && 'port' in value
  );
}

export function isSession(value: any): value is AppiumSession {
  return value && typeof value === 'object' && value.id && value.capabilities;
}

export async function readAppiumServerJson(
  uri: Uri
): Promise<AppiumSessionConfig> {
  const content = await workspace.fs.readFile(uri);
  return JSON.parse(content.toString());
}

export function isDisposable(value: any): value is Disposable {
  return value && typeof value.dispose === 'function';
}

export function isServerWatchable(server: AppiumSessionConfig) {
  return Boolean(server && server.host && server.port && server.protocol);
}
