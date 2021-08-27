import { workspace, ConfigurationScope } from 'vscode';
import { getCurrentWorkspaceFolderUri } from './workspace';

const CONFIG_NAMESPACE = 'appium';

type AppiumConfigSection = keyof AppiumExtensionConfig;

export function getConfigWithScope<T extends AppiumConfigSection>(
  scope?: ConfigurationScope,
  section?: AppiumConfigSection
) {
  const config = workspace.getConfiguration(CONFIG_NAMESPACE, scope);
  if (section) {
    return config.get<AppiumExtensionConfig[T]>(<string>section);
  }
  return config;
}

export function getConfig<T extends AppiumConfigSection>(
  section: T
): AppiumExtensionConfig[T];
export function getConfig<T extends AppiumConfigSection | undefined>(
  section?: T
) {
  return getConfigWithScope(getCurrentWorkspaceFolderUri(), section);
}
