import videojs, { VideoJsPlayer } from 'video.js';
import { CaptionsCustomizeMenuItem } from './controlbar-customize-captions-menu-item';
import { CustomComponentOptions } from '../player/player';

import { Dispatch } from 'redux';
import ISO6391 from 'iso-639-1-plus';
import { getNativeName } from '../lib/get-native-name';
import { toTitleCase } from '../lib/toTitleCase';

// Closed Captions control bar button with custom popup menu
const SubsCapsButton = videojs.getComponent('SubsCapsButton');
const MenuItem = videojs.getComponent('MenuItem');

/**
 * This button is an extension of the VideoJS built-in SubsCapsButton.
 *
 * We inherit all of the SubsCapsButton functionality:
 *  - caption visibility toggling
 *  - menu item selection/de-selection
 *
 * and simply apply a few overrides to the user-facing labels, e.g., — "Captions Off" -> "Off", "Spanish" -> "Español".
 * This menu button also features an extension of the VideoJS CaptionsSettingsMenuItem so that we may launch our own
 * custom captions styling UI. */

export class ManifestCaptionsButton extends SubsCapsButton {
  private modal?: videojs.ModalDialog;
  private dispatch?: Dispatch;

  constructor(
    player: VideoJsPlayer,
    options: CustomComponentOptions,
    modal: videojs.ModalDialog,
    dispatch: Dispatch
  ) {
    // Invoke the superclass to get all of the features of the component out of the box
    super(player, options);

    this.controlText('Closed Captions');
    this.modal = modal;
    this.dispatch = dispatch;
  }

  buildCSSClass(): string {
    return `${super.buildCSSClass()} vjs-pbs-captions-button`;
  }

  createItems(): videojs.CaptionSettingsMenuItem[] {
    // The initial set of items that video.js gives us
    // @ts-ignore
    const defaultItems = super.createItems();

    /**
     *  TODO -- don't hide manifest captions button when there are no subtitles/captions detected. We are currently extending the default VideoJS captions button and maintaining most of its internal logic (rather than override). That button is set to hide when there are no text tracks detected, but we need to override that particular behavior and always show the button for legal reasons.
     */
    // PLYR-776 we need to filter out the default video.js "Customize" menu item
    // so that we can insert our custom one later
    const items = defaultItems.filter((item) => {
      return item.name_ !== 'CaptionSettingsMenuItem';
    });

    // Move 'off' option to the end of the list
    for (let i = 0; i < items.length; i++) {
      const menuItemLabel: string = items[i].options_.label;

      // VideoJS changes the label for the 'off' option as the button is being initialized and manifest captions are being parsed.
      if (
        menuItemLabel === 'captions off' ||
        menuItemLabel === 'captions and subtitles off'
      ) {
        const offItem: videojs.MenuItem = items[i];
        // remove the found item
        items.splice(i, 1);
        // add it to the end of the list
        items.push(offItem);
      }
    }

    // Create a menu title
    const closedCaptionsMenuTitleItem: videojs.MenuItem = new MenuItem(
      this.player(),
      {
        label: 'Closed Captions',
        selectable: false,
      }
    );
    closedCaptionsMenuTitleItem.addClass('vjs-menu-title');
    closedCaptionsMenuTitleItem.removeClass('vjs-menu-item');

    // Add the menu title to the beginning of the list
    items.unshift(closedCaptionsMenuTitleItem);

    // Add the "Customize" captions styling menu item

    const customizeCaptions = new CaptionsCustomizeMenuItem(
      this.player(),
      // The CaptionSettingsMenuItem type has a special options that is sort of weird
      // but these settings made the type library happy. It takes a track even though it's not really a text track.
      {
        kind: 'captions',
        label: 'Customize',
        track: {
          kind: 'captions',
          label: 'Customize',
          //@ts-ignore
          selectable: false,
          default: false,
          mode: 'disabled',
        },
        selectable: false,
      },
      //@ts-ignore
      this.modal,
      this.dispatch
    );
    customizeCaptions.addClass('vjs-pbs-cc-customize');
    // remove the default VideoJS class
    customizeCaptions.removeClass('vjs-texttrack-settings');

    // Add 'Customize' to the end of the list.
    items.push(customizeCaptions);

    // Re-label some menu items
    for (let i = 0; i < items.length; i++) {
      const menuItemLabel: string = items[i].options_.label;

      if (
        menuItemLabel === 'captions off' ||
        menuItemLabel === 'captions and subtitles off'
      ) {
        // Override the user-facing label for toggling captions off
        items[i].contentEl().firstChild.innerText = 'Off';

        // TODO cleanup this POC code and adapt for production
        // ! POC A11Y open captions special case
        const url = window.location.href;
        //@ts-ignore
        const playlist = this.player().playlist;
        const isOpenCaptions: boolean = url.indexOf('poc-test-d') != -1;

        if (isOpenCaptions && playlist.currentIndex() === 1) {
          items[i].contentEl().firstChild.innerText = 'Open Captions';
        }
        // ! ----------------------
      }

      if (menuItemLabel === 'captions settings') {
        // We add the icon in front of the text via css
        items[i].contentEl().firstChild.innerText = 'Customize';
      }

      // This seems excessive but was the most straightforward way I could come up with
      // that would filter out non-language labels from the set of menu items to convert to native name
      const allLanguageNames: string[] = ISO6391.getAllNames();

      // For each language available, override the default english label with its native name
      if (allLanguageNames.includes(menuItemLabel)) {
        // TODO rather than two hops, can we parse manifest values for language code? if so, we can eliminate the allLanguageNames array above.
        const languageCode = ISO6391.getCode(
          toTitleCase(items[i].options_.label)
        );
        items[i].contentEl().firstChild.innerText = getNativeName(languageCode);
      } else if (menuItemLabel === 'English CC') {
        // Special case for DRM videos that define the label with 'CC' in it
        items[i].contentEl().firstChild.innerText = 'English';
      }
    }

    return items;
  }
}

videojs.registerComponent('ManifestCaptionsButton', ManifestCaptionsButton);
videojs.registerComponent(
  'CaptionsCustomizeMenuItem',
  CaptionsCustomizeMenuItem
);
