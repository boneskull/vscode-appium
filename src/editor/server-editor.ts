import { html, safeHtml } from 'common-tags';
import path from 'path';
import { JsonObject, JsonValue } from 'type-fest';
import {
  CancellationToken,
  CustomTextEditorProvider,
  Disposable,
  ExtensionContext,
  Range,
  TextDocument,
  Uri,
  WebviewPanel,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { ConfigService } from '../service/config';
import { LoggerService } from '../service/logger';

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
  private settings?: Map<ConfigPath, JsonObject>;
  private settingsFragments: Map<ConfigPath, string> = new Map();

  public static readonly viewType = 'appium.serverEditor';

  constructor(private context: ExtensionContext) {}

  public static keyToSentenceCase(str: string) {
    // adding space between strings
    const parts = str.split('.');

    const strToSentenceCase = (str: string) => {
      const result = str.replace(/([A-Z])/g, ' $1');

      // converting first character to uppercase and join it to the final string
      return result.charAt(0).toUpperCase() + result.slice(1);
    };
    return parts.map(strToSentenceCase).join(' > ');
  }

  public static register(context: ExtensionContext): Disposable {
    const provider = new ServerEditorProvider(context);
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
    const updateWebview = () => {
      webviewPanel.webview.postMessage({
        type: 'update',
        json: this.getDocumentAsJson(document),
      });
    };

    // Setup initial content for the webview
    const { webview } = webviewPanel;
    webview.options = {
      enableScripts: true,
    };

    webview.onDidReceiveMessage(
      (event) => {
        switch (event.type) {
          case 'update':
            const { id, value } = event;
            const json = this.getDocumentAsJson(document);
            json[id] = value;
            this.updateTextDocument(document, json);
            break;
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
        if (String(event.document.uri) === String(document.uri)) {
          updateWebview();
        }
      },
      null,
      this.disposables
    );

    // pre-fill the html with the current set of values
    this.render(webviewPanel);

    // send the (same) values to the webview to persist the state
    updateWebview();
  }

  private getDocumentAsJson(document: TextDocument): JsonObject {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        'Could not get document as json. Content is not valid json'
      );
    }
  }

  /**
   * THIS IS ALL HORRIBLE, I AM SORRY
   * @param currentPanel
   * @returns
   */
  private getHtmlForWebviewPanel(currentPanel: WebviewPanel): string {
    const fileUri = (fp: string) => {
      const fragments = fp.split('/');

      return Uri.file(path.join(this.context.extensionPath, ...fragments));
    };

    const assetUri = (fp: string) => {
      return currentPanel.webview.asWebviewUri(fileUri(fp));
    };

    const { cspSource } = currentPanel.webview;
    const nonce = getNonce();
    const componentLib = assetUri(
      'node_modules/@bendera/vscode-webview-elements/dist/bundled.js'
    );
    const cssLib = assetUri('node_modules/@vscode/codicons/dist/codicon.css');
    const serverEditorWebviewLib = assetUri(
      'src/editor/resources/server-editor-webview.js'
    );

    this.log.debug(componentLib, cssLib);

    const formHtml = [...this.settingsFragments].map(([key, value]) => value);

    return html`
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
            ${formHtml}
            <!-- <vscode-button primary id="saveButton">Save</vscode-button> -->
          </vscode-form-container>
          <script src="${componentLib}" nonce="${nonce}" type="module"></script>
          <script src="${serverEditorWebviewLib}" nonce="${nonce}"></script>
        </body>
      </html>
    `;
  }

  private async getSettings(): Promise<Map<ConfigPath, JsonObject>> {
    if (this.settings) {
      return this.settings;
    }
    const pkg = require('../../package.json');

    this.settings = new Map(
      Object.keys(pkg.contributes.configuration.properties)
        .filter((key) => key.startsWith('appium.sessionDefaults'))
        .map((key) => [
          key.replace(/^appium\./, '') as ConfigPath,
          pkg.contributes.configuration.properties[key],
        ])
    );

    this.settings.set('sessionDefaults.nickname', {
      description: 'Nickname for server. Defaults to "<host>:<port>"',
      type: 'string',
    });
    return this.settings;
  }

  private async render(webviewPanel: WebviewPanel): Promise<void> {
    const setFormHtml = (
      key: ConfigPath,
      value: string,
      setting: JsonObject
    ) => {
      value =
        html`<vscode-form-group variant="settings-group"
          >${value} <vscode-form-helper></vscode-form-helper
        ></vscode-form-group>` +
        safeHtml`${
          setting.description ??
          setting._description ??
          setting.markdownDescription
        }` +
        html`</vscode-form-helper
        >
      </vscode-form-group>`;
      this.settingsFragments.set(key, value);
    };

    const settings = await this.getSettings();
    settings.forEach((setting, key) => {
      const label = ServerEditorProvider.keyToSentenceCase(key);
      const configValue = this.config.get(key);
      switch (setting.type) {
        case 'boolean':
          setFormHtml(
            key,
            html`<vscode-form-label>${label}</vscode-form-label
              ><vscode-checkbox
                id="${key}"
                name="${key}"
                value="true"
                ${configValue === true ? 'checked' : ''}
              ></checkbox>`,
            setting
          );
          break;
        case 'string':
          // NOTE: radio buttons are basically invisible
          if (setting.enum) {
            const select = html`<vscode-form-label>${label}</vscode-form-label>
              ><vscode-single-select id="${key}" name="${key}">
                ${(<string[]>setting.enum).map(
                  (value) =>
                    html`<vscode-option
                      value="${value}"
                      ${configValue === value ? 'selected' : ''}
                    >
                      ${value}
                    </vscode-option>`
                )}
              </vscode-single-select>`;
            setFormHtml(key, select, setting);
          } else {
            setFormHtml(
              key,
              html`<vscode-label>${label}</vscode-label
                ><vscode-inputbox
                  id="${key}"
                  type="text"
                  value="${configValue ? configValue : ''}"
                  message="some message"
                ></vscode-inputbox>`,
              setting
            );
          }
          break;
        case 'number':
          setFormHtml(
            key,
            html`<vscode-label>${label}</vscode-label
              ><vscode-inputbox
                id="${key}"
                type="number"
                value="${configValue ? configValue : ''}"
                message="some message"
              ></vscode-inputbox>`,
            setting
          );
          break;
      }
    });
    webviewPanel.webview.html = this.getHtmlForWebviewPanel(webviewPanel);
  }

  /**
   * Write out the json to a given document.
   */
  private updateTextDocument(document: TextDocument, json: JsonValue) {
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
