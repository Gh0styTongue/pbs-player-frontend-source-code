import videojs, { VideoJsPlayer } from 'video.js';
import { VideoJsPBSPlayer, CustomComponentOptions } from '../player/player';
import * as captionsStore from '../captions/store';
import { Dispatch } from 'redux';
import { getTextTracks } from './text-tracks';
import {
  deselectAllItems,
  toggleButtonOff,
  toggleButtonOn,
} from '../captions/toggle-captions';
import { saveState } from '../lib/local-storage';
import { CAPTIONS_SELECTION_KEY } from '../captions/store';

// Closed Captions control bar button with custom popup menu
const SubsCapsButton = videojs.getComponent('SubsCapsButton');
const MenuItem = videojs.getComponent('MenuItem');

class CaptionsOffMenuItem extends MenuItem {
  constructor(player: VideoJsPBSPlayer, options) {
    // MenuItem.call(this, player, options);
    super(player, options);

    this.controlText('Closed Captions Off');
  }

  handleClick() {
    const tracks = this.player().remoteTextTracks();
    const legacySidecarCaptionsButton = this.player()
      .getChild('controlBar')
      ?.getChild('legacySidecarCaptionsButton');

    if (legacySidecarCaptionsButton) {
      // deselect everything in the menu
      deselectAllItems(legacySidecarCaptionsButton);

      // toggle the button icon to 'off'
      toggleButtonOff(legacySidecarCaptionsButton);
    }

    // select this menu item
    this.selected(true);

    // save the selection to local storage
    saveState(CAPTIONS_SELECTION_KEY, 'Off');

    // set all tracks to disabled regardless of kind or label
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      track.mode = 'disabled';
    }
  }
}

class CaptionsLanguageMenuItem extends MenuItem {
  private track?: videojs.TextTrackOptions;

  constructor(player, options, track) {
    super(player, options);
    this.controlText(`Closed Captions ${track.label}`);

    this.track = track;
  }

  handleClick() {
    const playerTracks = getTextTracks(this.player());

    const legacySidecarCaptionsButton = this.player()
      .getChild('controlBar')
      ?.getChild('legacySidecarCaptionsButton');

    if (legacySidecarCaptionsButton) {
      // deselect everything in the menu
      deselectAllItems(legacySidecarCaptionsButton);

      // toggle the button icon to 'on'
      toggleButtonOn(legacySidecarCaptionsButton);
    }

    // loop and only select / toggle the matching caption
    for (let i = 0; i < playerTracks.length; i++) {
      const textTrack: videojs.TextTrackOptions = playerTracks[i];

      if (
        this.track &&
        this.track.srclang === textTrack.language &&
        this.track.kind === textTrack.kind
      ) {
        // set the track to showing
        textTrack.mode = 'showing';
        // save the selection to local storage using language native name
        saveState(CAPTIONS_SELECTION_KEY, this.track.label);
        // select the menu item
        this.selected(true);
      } else {
        textTrack.mode = 'disabled';
      }
    }
  }
}

class CaptionsCustomizeMenuItem extends MenuItem {
  private dispatch: Dispatch;
  private modal: videojs.ModalDialog;

  constructor(player, options, modal, dispatch) {
    super(player, options);
    this.controlText('Open Captions Settings');
    this.modal = modal;
    this.dispatch = dispatch;
  }

  buildCSSClass(): string {
    return `${super.buildCSSClass()} vjs-pbs-cc-customize`;
  }

  handleClick() {
    this.dispatch(captionsStore.launchCaptionsModal(this.modal));
  }
}

export class LegacySidecarCaptionsButton extends SubsCapsButton {
  private modal?: videojs.ModalDialog;
  private dispatch?: Dispatch;
  private sidecarCaptions?: videojs.TextTrackOptions[];

  constructor(
    player: VideoJsPlayer,
    options: CustomComponentOptions,
    modal: videojs.ModalDialog,
    dispatch: Dispatch,
    sidecarCaptions: videojs.TextTrackOptions[]
  ) {
    super(player, options);
    this.modal = modal;
    this.dispatch = dispatch;
    this.sidecarCaptions = sidecarCaptions;

    this.controlText('Closed Captions');
    this.addClass('vjs-pbs-cc-button');
    // add a class to the vjs-menu child node of the menu button
    //@ts-ignore
    this.menu.addClass('vjs-pbs-cc-button-menu');
  }

  buildCSSClass(): string {
    return `${super.buildCSSClass()} vjs-pbs-captions-button`;
  }

  createItems(): videojs.MenuItem[] {
    // Closed Captions menu title - not selectable
    const closedCaptionsMenuTitleItem: videojs.MenuItem = new MenuItem(
      this.player(),
      {
        label: 'Closed Captions',
        selectable: false,
      }
    );
    closedCaptionsMenuTitleItem.addClass('vjs-menu-title');
    closedCaptionsMenuTitleItem.removeClass('vjs-menu-item');

    if (this.sidecarCaptions?.length === 0) {
      // show the 'None' menu item as a fallback if no sidecar captions are available
      const noneItem = new MenuItem(this.player(), {
        label: 'None',
        selectable: false,
        multiSelectable: false,
      });

      return [closedCaptionsMenuTitleItem, noneItem];
    } else {
      const captionLanguageMenuItems: videojs.MenuItem[] = [];

      // Create one menu item for each available sidecar caption
      this.sidecarCaptions?.map((track: videojs.TextTrackOptions) => {
        captionLanguageMenuItems.push(
          new CaptionsLanguageMenuItem(
            this.player(),
            {
              label: track.label, // already translated to native name
              name: track.label,
              selectable: true,
              multiSelectable: false,
            },
            track
          )
        );
      });

      // Captions Off menu item
      const captionsOffItem: CaptionsOffMenuItem = new CaptionsOffMenuItem(
        this.player(),
        {
          label: 'Off',
          name: 'Off',
          selectable: true,
        }
      );

      // 'Customize' menu item is initialized and added in captions/store.ts
      const customizeCaptions: CaptionsCustomizeMenuItem =
        new CaptionsCustomizeMenuItem(
          this.player(),
          {
            label: 'Customize',
            selectable: true,
          },
          this.modal,
          this.dispatch
        );
      customizeCaptions.addClass('vjs-pbs-cc-customize');

      return [
        closedCaptionsMenuTitleItem,
        ...captionLanguageMenuItems,
        captionsOffItem,
        customizeCaptions,
      ];
    }
  }
}

videojs.registerComponent('CaptionsOffMenuItem', CaptionsOffMenuItem);
videojs.registerComponent('CaptionsLanguageMenuItem', CaptionsLanguageMenuItem);
videojs.registerComponent(
  'CaptionsCustomizeMenuItem',
  CaptionsCustomizeMenuItem
);
videojs.registerComponent(
  'LegacySidecarCaptionsButton',
  LegacySidecarCaptionsButton
);
