import videojs from 'video.js';
import { VideoJsPBSPlayer } from './player';
import { AccessibilitySource } from './player-get-accessible-sources';

const MenuItem = videojs.getComponent('MenuItem');
const MenuButton = videojs.getComponent('MenuButton');
class PlaylistMenuItem extends MenuItem {
  private vjsPlayer?: VideoJsPBSPlayer | undefined;
  private label: string;
  private index: number;

  constructor(
    player: VideoJsPBSPlayer,
    options: videojs.MenuItemOptions,
    index: number
  ) {
    super(player, options);
    this.controlText('Select Source');
    this.vjsPlayer = player;
    this.index = index;
    this.label = options.label || '';
  }

  handleClick() {
    // mark this playlist as selected in the menu
    this.selected(true);

    // bug: we have to manually loop through the menu items and deselect all others
    this.deselectOtherItems(this.label);

    // jump the player to that source
    if (this.vjsPlayer && this.vjsPlayer.playlist !== undefined) {
      // TODO fix types in player.tsx
      //@ts-ignore
      this.vjsPlayer.playlist.currentItem(this.index);
    }
  }

  deselectOtherItems(playlistItemLabel: string) {
    const controlBar = this.vjsPlayer?.getChild('controlBar');
    if (controlBar) {
      const playlistButton = controlBar.getChild(
        'PlaylistButton'
      ) as videojs.MenuButton;

      if (playlistButton) {
        const menuItems = playlistButton.menu.children_;
        for (const menuItem in menuItems) {
          const item = menuItems[menuItem];
          // TODO fix type mismatch between PlaylistMenuItem and Component here
          //@ts-ignore
          if (playlistItemLabel !== item.label) {
            //@ts-ignore
            item.selected(false);
          }
        }
      }
    }
  }
}

videojs.registerComponent('PlaylistMenuItem', PlaylistMenuItem);

export class PlaylistButton extends MenuButton {
  private playlistSources: AccessibilitySource[];

  constructor(
    player: VideoJsPBSPlayer,
    options: any, // eslint-disable-line
    playlistSources: AccessibilitySource[],
  ) {
    super(player, options);

    // Setting playlistSources in 'this' needs to be done
    // before the MenuButton class 'call' or else createItems is called
    // too early and the menu will appear blank.
    this.playlistSources = playlistSources;

    MenuButton.call(this, player, options);

    this.controlText('Accessibility Features');
    this.addClass('vjs-accessibility-menu');
  }

  buildCSSClass(): string {
    return `vjs-accessibility-menu ${super.buildCSSClass()}`;
  }

  createItems(): videojs.MenuItem[] {
    const sources = this.playlistSources;

    const sourcesMenuTitle = new MenuItem(this.player(), {
      label: 'Accessibility Features',
      selectable: false,
    });
    sourcesMenuTitle.addClass('vjs-menu-title');
    sourcesMenuTitle.removeClass('vjs-menu-item');

    if (sources) {
      const sourceMenuItems = sources.map(
        (source: AccessibilitySource, index: number) => {
          return new PlaylistMenuItem(
            //@ts-ignore
            this.player(),
            {
              // ! PLYR-788 - we'll need some sort of intelligent way to detect the appropriate label to use here or pass it manually
              label: source.label,
              selectable: true,
              multiSelectable: false,
              selected: source.isDefault || false,
            },
            index
          );
        }
      );

      return [sourcesMenuTitle, ...sourceMenuItems];
    }

    return [sourcesMenuTitle];
  }
}
