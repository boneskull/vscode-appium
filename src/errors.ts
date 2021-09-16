import { window } from 'vscode';
import { HTTPError, RequestError, TimeoutError } from 'got';

/**
 * A typeguarded version of `instanceof Error` for NodeJS.
 * @author Joseph JDBar Barron
 * @link https://dev.to/jdbar
 */
export function isNodeError<T extends new (...args: any) => Error>(
  value: unknown,
  errorType: T
): value is InstanceType<T> & NodeJS.ErrnoException {
  return value instanceof errorType;
}

export function isHTTPError(value: any): value is HTTPError {
  return value instanceof Error && value.name === 'HTTPError';
}

export function isRequestError(value: any): value is RequestError {
  return value instanceof Error && value.name === 'RequestError';
}

export class ConnectionRefusedError extends AggregateError {
  constructor(error: RequestError, message?: string) {
    super([error], message);
  }
}

export class NotFoundError extends AggregateError {
  constructor(error: HTTPError, message?: string) {
    super([error], message);
  }
}

export class UnknownError extends AggregateError {
  constructor(error: unknown, message?: string) {
    super([error], message);
  }
}

export type RemoteError =
  | ConnectionRefusedError
  | NotFoundError
  | UnknownError
  | TimeoutError;

export const { showErrorMessage, showWarningMessage, showInformationMessage } =
  window;
