import { window, ViewColumn, WebviewPanel } from 'vscode';
import { ServerModel } from '../server-model';
import { LoggerService } from '../service/logger';

/**
 * Takes a screenshot of an Appium session and displays it
 * @todo auto-refresh timer, button.
 * @param log Logger
 * @param serverInfo Server configuration object
 * @param sessionId Session ID
 * @returns A webview panel containing the screenshot
 */
export async function screenshot(
  log: LoggerService,
  serverInfo: AppiumSessionConfig | AppiumServerInfo,
  sessionId: string
): Promise<WebviewPanel> {
  const model = new ServerModel(log, serverInfo);

  const result = await model.getScreenshot(sessionId);
  const panel = window.createWebviewPanel(
    'appiumScreenshot',
    `Screenshot for session on ${serverInfo.nickname}`,
    ViewColumn.Beside,
    {}
  );
  // And set its HTML content
  result
    .map((screenshot) => {
      panel.webview.html = getWebviewContent(screenshot);
    })
    .mapErr((err) => {
      panel.webview.html = getErrorContent(err);
    });

  return panel;
}

function getHTMLWrapper(body: string) {
  return `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appium Screenshot</title>
</head>
<body>
  ${body}
</body>
</html>`;
}

function getErrorContent(error: Error | string): string {
  return getHTMLWrapper(`<strong>${error}</strong>`);
}

function getWebviewContent(screenshot: string): string {
  return getHTMLWrapper(
    `<img src="data:image/png;base64,${screenshot}" alt="screenshot"/>`
  );
}

screenshot.command = 'appium.screenshot';
