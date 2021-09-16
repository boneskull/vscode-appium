(function () {
  /** @type {import("vscode-webview").WebviewApi<{json: AppiumSettingsJsonMetadata}>} */
  const vscode = acquireVsCodeApi();

  const inputboxes = document.getElementsByTagName('vscode-inputbox');
  const singleSelects = document.getElementsByTagName('vscode-single-select');

  // setup events to persist to backend when changed
  // we only have inputboxes and single-selects. if we had more, we need to add more,
  // and probably update the `updateContent` handler.
  const formFields = [...inputboxes, ...singleSelects];

  const setInitialState = () => {
    /** @type {any} */
    const initialJson = {};
    for (let field of formFields) {
      const id = /** @type {keyof AppiumSettingsJsonMetadata} */ (
        field.getAttribute('id')
      );
      initialJson[id] = field.value;
    }
    vscode.setState({
      json: /** @type {AppiumSettingsJsonMetadata} */ (initialJson),
    });
  };

  /**
   * Syncs the form to the data.
   * @param {AppiumSettingsJsonMetadata} settings
   */
  const updateContent = (settings) => {
    Object.keys(settings)
      .map(
        (key) =>
          /** @type {VscodeInputbox | VscodeSingleSelect} */ (
            document.getElementById(key)
          )
      )
      .filter(Boolean)
      .forEach((el) => {
        const id = /** @type {keyof AppiumSettingsJsonMetadata} */ (
          el.getAttribute('id')
        );
        if (/** @type {VscodeSingleSelect} */ (el).options) {
          el = /** @type {VscodeSingleSelect} */ (el);
          el.selectedIndex = el.options.findIndex(
            (opt) => opt.value === settings[id]
          );
        } else {
          el = /** @type {VscodeInputbox} */ (el);
          el.value = String(settings[id]);
        }
      });
  };

  const initListeners = () => {
    for (let input of formFields) {
      const field = input.id;
      input.addEventListener('vsc-change', (event) => {
        const evt = /** @type {VscChangeEvent} */ (event);
        /** @type {string|number|undefined} */
        let value =
          typeof evt.detail === 'string' ? evt.detail : evt.detail?.value;
        if (input.getAttribute('type') === 'number') {
          value = parseInt(value, 10);
          if (isNaN(value)) {
            value = undefined;
          }
        }
        vscode.postMessage({ type: 'update', field, value });
      });
    }
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', ({ data: message }) => {
    switch (message.type) {
      case 'update':
        const { json } = message;

        // Update our webview's content
        updateContent(json);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ json });

        return;
    }
  });

  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads

  initListeners();
  const state = vscode.getState();
  if (state) {
    updateContent(state.json);
  }  else {
    setInitialState();
  }
})();

/**
 * @typedef {Event & {detail: string | {value: string}}} VscChangeEvent
 */

/**
 * @typedef {import('@bendera/vscode-webview-elements').VscodeInputbox} VscodeInputbox
 */

/**
 * @typedef {import('@bendera/vscode-webview-elements').VscodeSingleSelect} VscodeSingleSelect
 */
