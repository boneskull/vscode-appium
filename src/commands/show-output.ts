import { LoggerService } from '../service/logger';

export function showOutput() {
  LoggerService.get().show();
}

showOutput.command = 'appium.showOutput';
