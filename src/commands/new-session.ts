import {register} from '../command-utils';
import {window, ExtensionContext, Extension} from 'vscode';

const NAME = 'newSession';

async function chooseSessionType(): Promise<string | void> {
  return new Promise((resolve) => {
    const picker = window.createQuickPick();
    picker.title = 'New session on...';
    picker.items = [
      {
        label: 'Local machine',
        description: 'Create session on local machine',
      },
    ];
    picker.onDidAccept(() => {
      resolve(picker.selectedItems[0].label);
      picker.hide();
    });
    picker.onDidHide(() => {
      picker.dispose();
      resolve();
    });
    picker.show();
  });
}

export function newSession(ctx: ExtensionContext) {
  const commandID = register(ctx, NAME, async () => {
    const result = await chooseSessionType();
    console.log(result);
  });
  console.log(`registered ${commandID}`);
}
