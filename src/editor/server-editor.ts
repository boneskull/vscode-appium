import { html, safeHtml } from 'common-tags';
import { NormalizedPackageJson } from 'read-pkg-up';
import {
  CancellationToken,
  CustomTextEditorProvider,
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  Uri,
  Webview,
  WebviewPanel,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { showErrorMessage } from '../errors';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';

/**
 * This is the event that the webview posts to the {@link ServerEditorProvider}
 */
interface UpdateEvent<T extends keyof AppiumSessionConfig> extends Event {
  id: T;
  type: 'update';
  value: AppiumSessionConfig[T];
}

/**
 * TODO: pull these default values from the config
 */
const defaultAppiumSessionConfig: AppiumSessionConfig = {
  host: '127.0.0.1',
  port: 4723,
  protocol: 'http',
};

const getNonce = () => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export class ServerEditorProvider
  implements CustomTextEditorProvider, Disposable
{
  private config: ConfigService = ConfigService.get();
  private disposables: Disposable[] = [];
  private log: LoggerService = LoggerService.get();
  private settings?: AppiumSettingsJsonMetadata[];

  public static readonly viewType = 'appium.serverEditor';

  private constructor(private ctx: ExtensionContext) {}

  public static register(ctx: ExtensionContext): Disposable {
    const provider = new ServerEditorProvider(ctx);
    const providerRegistration = window.registerCustomEditorProvider(
      ServerEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }

  public async resolveCustomTextEditor(
    document: TextDocument,
    webviewPanel: WebviewPanel,
    token: CancellationToken
  ): Promise<void> {
    if (token.isCancellationRequested) {
      return;
    }

    const updateWebview = async () => {
      const json = this.getDocumentAsJson(document);
      await webviewPanel.webview.postMessage({
        type: 'update',
        json,
      });
    };

    const isUpdateEvent = <T extends keyof AppiumSessionConfig>(
      e: any
    ): e is UpdateEvent<T> => e.type === 'update';

    // Setup initial content for the webview
    const { webview } = webviewPanel;
    webview.options = {
      enableScripts: true,
    };

    webview.onDidReceiveMessage(
      async (event) => {
        if (isUpdateEvent(event)) {
          const { id, value } = event;
          try {
            const json = {
              ...(this.getDocumentAsJson(document) ??
                defaultAppiumSessionConfig),
              [id]: value,
            };
            if (!(await this.updateTextDocument(document, json))) {
              this.log.warn(
                'Could not apply change to document %s',
                document.fileName
              );
            }
          } catch (err) {
            showErrorMessage((<Error>err).message);
          }
        }
      },
      null,
      this.disposables
    );

    webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);

    webviewPanel.onDidChangeViewState(
      () => {
        if (webviewPanel.visible) {
          updateWebview();
        }
      },
      null,
      this.disposables
    );
    workspace.onDidChangeTextDocument(
      (event) => {
        if (
          event.document.uri.toString() === document.uri.toString() &&
          event.contentChanges.length
        ) {
          updateWebview();
        }
      },
      null,
      this.disposables
    );

    // pre-fill the html with the current set of values
    webviewPanel.webview.html = await this.getHtmlForWebview(
      webviewPanel.webview,
      this.getDocumentAsJson(document)
    );
  }

  private getDocumentAsJson(
    document: TextDocument
  ): AppiumSessionConfig | undefined {
    const text = document.getText();
    if (text.trim().length === 0) {
      return { ...defaultAppiumSessionConfig };
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      showErrorMessage(`File ${document.fileName} is not valid JSON`);
    }
  }

  /**
   * I SHOULD HAVE USED A JAVASCRIPT FRAMEWORK
   * @param webview
   */
  private async getHtmlForWebview(
    webview: Webview,
    json?: AppiumSessionConfig
  ): Promise<string> {
    const assetUri = (...pathSegments: string[]) =>
      webview.asWebviewUri(
        Uri.joinPath(this.ctx.extensionUri, ...pathSegments)
      );

    const buildFormFragment = (
      fragment: string,
      setting: AppiumSettingsJsonMetadata
    ) => {
      return (
        html`<vscode-form-group variant="settings-group"
          >${fragment} <vscode-form-helper></vscode-form-helper
        ></vscode-form-group>` +
        safeHtml`${setting.description ?? setting.markdownDescription}` +
        html`</vscode-form-helper
          >
        </vscode-form-group>`
      );
    };

    const toSentenceCase = (str: string) => {
      // adding space between strings
      const parts = str.split('.');

      const strToSentenceCase = (str: string) => {
        const result = str.replace(/([A-Z])/g, ' $1');

        // converting first character to uppercase and join it to the final string
        return result.charAt(0).toUpperCase() + result.slice(1);
      };
      return parts.map(strToSentenceCase).join(' > ');
    };

    const settings = await this.getSettings();

    const buildFormFragments = (): string => {
      const formFragments: string[] = [];

      settings.map((setting) => {
        const { id, configKey } = setting;
        const label = toSentenceCase(id);
        const configValue = configKey && this.config.get(configKey);
        const fileValue = json?.[id];
        const value = fileValue ?? configValue ?? '';
        switch (setting.type) {
          case 'boolean':
            formFragments.push(
              buildFormFragment(
                html`<vscode-form-label>${label}</vscode-form-label
                ><vscode-checkbox
                  id="${id}"
                  name="${id}"
                  value="true"
                  ${configValue === true ? 'checked' : ''}
                ></checkbox>`,
                setting
              )
            );
            break;
          case 'string':
            // NOTE: radio buttons are basically invisible
            if (setting.enum) {
              const select = html`<vscode-form-label
                  >${label}</vscode-form-label
                >
                ><vscode-single-select id="${id}" name="${id}">
                  ${(<string[]>setting.enum).map(
                    (optionValue) =>
                      html`<vscode-option
                        value="${optionValue}"
                        ${value === optionValue ? 'selected' : ''}
                      >
                        ${optionValue}
                      </vscode-option>`
                  )}
                </vscode-single-select>`;
              formFragments.push(buildFormFragment(select, setting));
            } else {
              formFragments.push(
                buildFormFragment(
                  html`<vscode-label>${label}</vscode-label
                    ><vscode-inputbox
                      id="${id}"
                      type="text"
                      value="${value}"
                    ></vscode-inputbox>`,
                  setting
                )
              );
            }
            break;
          case 'number':
            formFragments.push(
              buildFormFragment(
                html`<vscode-label>${label}</vscode-label
                  ><vscode-inputbox
                    id="${id}"
                    type="number"
                    value="${configValue ?? ''}"
                  ></vscode-inputbox>`,
                setting
              )
            );
            break;
        }
      });
      return formFragments.join('\n');
    };
    const { cspSource } = webview;
    const nonce = getNonce();
    const componentLib = assetUri(
      'node_modules',
      '@bendera',
      'vscode-webview-elements',
      'dist',
      'bundled.js'
    );
    const cssLib = assetUri(
      'node_modules',
      '@vscode',
      'codicons',
      'dist',
      'codicon.css'
    );
    const serverEditorWebviewLib = assetUri(
      'src',
      'editor',
      'webview',
      'server-editor-webview.js'
    );

    const formFragment = buildFormFragments();

    const webviewHtml = html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Document</title>
          <meta
            http-equiv="Content-Security-Policy"
            content="
          default-src 'none'; 
          img-src ${cspSource};
          script-src ${cspSource}
          nonce-${nonce}; 
          style-src 'unsafe-inline' ${cspSource};
          style-src-elem 'unsafe-inline' ${cspSource};
          font-src ${cspSource};
        "
          />
          <link
            rel="stylesheet"
            href="${cssLib}"
            nonce="${nonce}"
            id="vscode-codicon-stylesheet"
          />
        </head>
        <body>
          <vscode-form-container id="serverEditorForm">
            ${formFragment}
          </vscode-form-container>
          <script src="${componentLib}" nonce="${nonce}" type="module"></script>
          <script src="${serverEditorWebviewLib}" nonce="${nonce}"></script>
        </body>
      </html>
    `;
    return webviewHtml;
  }

  private async getSettings(): Promise<AppiumSettingsJsonMetadata[]> {
    if (this.settings) {
      return this.settings;
    }
    const pkgJson = await workspace.fs.readFile(
      Uri.joinPath(this.ctx.extensionUri, 'package.json')
    );
    // not quite, but close enough
    const pkg: NormalizedPackageJson = JSON.parse(pkgJson.toString());

    const settings: AppiumSettingsJsonMetadata[] = [
      {
        description: 'Nickname for server. Defaults to "<host>:<port>"',
        type: 'string',
        id: 'nickname',
      },
      ...Object.keys(pkg.contributes.configuration.properties)
        .filter((key) => key.startsWith('appium.sessionDefaults'))
        .map((key) => {
          const id = key.replace(/^appium\.sessionDefaults\./, '');
          return {
            ...pkg.contributes.configuration.properties[key],
            id,
            // yeah the markdownDescription is not ok to use, because the webview
            // doesn't know anything about markdown.  this is a naive attempt to strip out the
            // little markdown we have in there.  the "`#...#`" thing is a special vscode configuration link,
            // since we're reusing the configuration properties.
            description:
              pkg.contributes.configuration.properties[key].description ??
              pkg.contributes.configuration.properties[key].markdownDescription
                .replace(/`#|#`/g, '"')
                .replace('appium.sessionDefaults', ''),
          };
        }),
    ];

    return (this.settings = settings);
  }

  /**
   * Write out the json to a given document.
   */
  private async updateTextDocument(
    document: TextDocument,
    json: AppiumSessionConfig
  ): Promise<boolean> {
    const edit = new WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2)
    );

    return workspace.applyEdit(edit);
  }
}
