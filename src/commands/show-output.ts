import { LoggerService } from '../logger-service';

export function showOutput(log: LoggerService) {
  log.show();
}

showOutput.command = 'appium.showOutput';
