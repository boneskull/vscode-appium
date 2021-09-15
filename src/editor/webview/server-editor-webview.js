(function () {
  /** @type {import("vscode-webview").WebviewApi<{json: AppiumSettingsJsonMetadata}>} */
  const vscode = acquireVsCodeApi();

  const inputboxes = document.getElementsByTagName('vscode-inputbox');
  const singleSelects = document.getElementsByTagName('vscode-single-select');

  // setup events to persist to backend when changed
  // we only have inputboxes and single-selects. if we had more, we need to add more,
  // and probably update the `updateContent` handler.
  const formFields = [
    ...inputboxes,
    ...singleSelects,
  ];

  

  const setInitialState = () => {
    /** @type {any} */
    const initialJson = {};
    for (let field of formFields) {
      const id = /** @type {keyof AppiumSettingsJsonMetadata} */ (field.getAttribute('id'));
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
        if (/** @type {VscodeSingleSelect} */(el).options) {
          /** @type {VscodeSingleSelect} */(el).selectedIndex = /** @type {VscodeSingleSelect} */(el).options.findIndex(opt => opt.value === settings[id]);
        } else {
          el.value = String(settings[id]);
        }
      });
  };

  const initListeners = () => {
    for (let input of formFields) {
      const id = input.id;
      input.addEventListener('vsc-change', (event) => {
        const value  = /** @type {VscChangeEvent} */ (event).detail.value;

        vscode.postMessage({ type: 'update', id, value });
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
  } else {
    setInitialState();
  }
})();

/**
 * @typedef {Event & {detail: {value: string}}} VscChangeEvent
 */

/**
 * @typedef {import('@bendera/vscode-webview-elements').VscodeInputbox} VscodeInputbox
 */

/**
 * @typedef {import('@bendera/vscode-webview-elements').VscodeSingleSelect} VscodeSingleSelect
 */
