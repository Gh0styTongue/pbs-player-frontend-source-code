import videojs from 'video.js';
import { VideoJsPBSPlayer, CustomComponentOptions } from '../player/player';

// Playback Speed menu button with custom items and title
const PlaybackSpeedMenuButton = videojs.getComponent('PlaybackRateMenuButton');
const PlaybackSpeedMenuItem = videojs.getComponent('PlaybackRateMenuItem');
const Menu = videojs.getComponent('Menu');
const MenuItem = videojs.getComponent('MenuItem');

interface PlaybackSpeedMenuItemOptions extends videojs.MenuItemOptions {
  rate: string;
}
class PlaybackSpeedItem extends PlaybackSpeedMenuItem {
  constructor(player: VideoJsPBSPlayer, options: PlaybackSpeedMenuItemOptions) {
    super(player, options);
    this.controlText('Set Playback Speed');
  }

  handleClick() {
    // select this menu item
    //@ts-ignore
    this.selected(true);
    // set the playback rate to this menu item's value
    //@ts-ignore
    this.player().playbackRate(this.rate);
  }
}

videojs.registerComponent('PlaybackSpeedItem', PlaybackSpeedItem);

export class PlaybackSpeedButton extends PlaybackSpeedMenuButton {
  constructor(player: VideoJsPBSPlayer, options: CustomComponentOptions) {
    super(player, options);
    PlaybackSpeedMenuButton.call(this, player, options);
    this.controlText('Playback Speed Menu');
    this.removeClass('vjs-hidden');
  }

  buildCSSClass(): string {
    return 'vjs-playback-rate vjs-menu-button vjs-menu-button-popup vjs-control vjs-button vjs-showing';
  }

  playbackRates(): number[] {
    return this.player().options_.playbackRates || [];
  }

  createMenu(): videojs.Menu {
    const menu = new Menu(this.player());
    const rates = this.playbackRates();

    const playbackSpeedMenuTitle = new MenuItem(this.player(), {
      label: 'Playback Speed',
      selectable: false,
      multiSelectable: false,
    });
    playbackSpeedMenuTitle.addClass('vjs-menu-title');
    playbackSpeedMenuTitle.removeClass('vjs-menu-item');

    menu.addChild(playbackSpeedMenuTitle);

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(
          new PlaybackSpeedItem(this.player(), {
            multiSelectable: false,
            selectable: true,
            rate: rates[i] + 'x',
          })
        );
      }
    }

    return menu;
  }
}
