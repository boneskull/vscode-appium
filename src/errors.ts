import { window } from 'vscode';
import { HTTPError, RequestError } from 'got';

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

// interface WindowProxy {
//   showErrorMessage: typeof window.showErrorMessage;
//   showWarningMessage: typeof window.showWarningMessage;
//   showInformationMessage: typeof window.showInformationMessage;
// }

// const windowProxy = new Proxy(
//   <WindowProxy>{
//     showErrorMessage: window.showErrorMessage,
//     showWarningMessage: window.showWarningMessage,
//     showInformationMessage: window.showInformationMessage,
//   },
//   {
//     get(target, prop: keyof WindowProxy) {
//       return (...args: any[]) => {
//         if (prop in target) {
//           if (args[0] instanceof Error) {
//             return target[prop](args[0].message, ...args.slice(1));
//           }
//           return target[prop];
//         }
//       };
//     },
//   }
// );

// export const showErrorMessage = windowProxy.showErrorMessage;
// export const showWarningMessage = windowProxy.showWarningMessage;
// export const showInformationMessage = windowProxy.showInformationMessage;

export const { showErrorMessage, showWarningMessage, showInformationMessage } =
  window;
