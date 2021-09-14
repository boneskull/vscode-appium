// @ts-check

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const updateContent = (json) => {
    Object.keys(json).forEach((key) => {
      // @ts-ignore
      document.getElementById(key).value = json[key];
    });
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
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
  const state = vscode.getState();
  if (state) {
    updateContent(state.json);
  }

  // setup events to persist to backend when changed
  // we only have inputboxes and single-selects. if we had more, we need to add more,
  // and probably update the `updateContent` handler.
  const inputBoxes = [
    ...document.getElementsByTagName('vscode-inputbox'),
    ...document.getElementsByTagName('vscode-single-select'),
  ];
  for (let input of inputBoxes) {
    input.addEventListener('vsc-change', (event) => {
      // @ts-ignore
      const { detail: value } = event;
      const { id } = input;
      vscode.postMessage({ type: 'update', id, value });
    });
  }

})();
