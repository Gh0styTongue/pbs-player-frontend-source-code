import videojs from 'video.js';

// This file takes a custom CC Button and toggles the vjs-captions-off class to swap the icon.
export function toggleButtonOn(button: videojs.Component): void {
  if (button.hasClass('vjs-captions-off')) {
    button.removeClass('vjs-captions-off');
  }
}

export function toggleButtonOff(button: videojs.Component): void {
  if (!button.hasClass('vjs-captions-off')) {
    button.addClass('vjs-captions-off');
  }
}

export const deselectAllItems = (button: videojs.Component): void => {
  const buttonChildren: videojs.Component[] = button.children();

  for (const item in buttonChildren) {
    const itemChildren: videojs.Component[] = buttonChildren[item].children();

    if (itemChildren.length > 0) {
      itemChildren.map((i: videojs.Component) => {
        const selectionItem = i as videojs.MenuItem;
        selectionItem.selected(false);
      });
    }
  }
};

export const selectItemByLabel = (
  button: videojs.Component,
  label: string
): void => {
  const buttonChildren: videojs.Component[] = button.children();

  for (const item in buttonChildren) {
    const itemChildren: videojs.Component[] = buttonChildren[item].children();

    if (itemChildren.length > 0) {
      itemChildren.map((i: videojs.Component) => {
        const selectionItem = i as videojs.MenuItem;
        if (selectionItem.options_.label === label) {
          selectionItem.selected(true);
        }
      });
    }
  }
};
