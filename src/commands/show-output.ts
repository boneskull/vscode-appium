import { LoggerService } from '../service/logger';

export function showOutput(log: LoggerService) {
  log.show();
}

showOutput.command = 'appium.showOutput';
