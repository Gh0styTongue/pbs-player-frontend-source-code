import videojs from 'video.js';
import ISO6391 from 'iso-639-1-plus';
import { toTitleCase } from './toTitleCase';
import { getNativeName } from '../lib/get-native-name';

// Go through a Component menu and update label names to their native names
export const updateNativeNameTranslations = (
  button: videojs.Component
): void => {
  const allLanguageNames: string[] = ISO6391.getAllNames();

  const buttonChildren = button.children();
  if (buttonChildren && buttonChildren.length > 1) {
    // the 0 element is the button itself, 1 is the menu of items
    const menuItems = buttonChildren[1]?.children();

    if (menuItems) {
      // Go through the items and use the translated native name
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i] as videojs.MenuItem; // trust me
        const itemLabel = item.options_.label || '';

        // For each language available, override the default english label with its native name
        if (allLanguageNames.includes(itemLabel)) {
          const languageCode = ISO6391.getCode(toTitleCase(itemLabel));

          //@ts-ignore
          item.contentEl().firstChild.innerText = getNativeName(languageCode);
        }
      }
    }
  }
};
