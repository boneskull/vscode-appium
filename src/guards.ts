export function isServerInfo(value: any): value is AppiumServerInfo {
  return value && typeof value === 'object' && value.host && value.port;
}

export function isSession(value: any): value is AppiumSession {
  return value && typeof value === 'object' && value.id && value.capabilities;
}
