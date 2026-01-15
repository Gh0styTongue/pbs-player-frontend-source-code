import videojs from 'video.js';
import {
  VideoJsPBSPlayer,
  CustomComponentOptions,
  BitrateInfo,
} from '../player/player';

// This button is used when a DASH / DRM video has been detected. Otherwise, it uses the HLS-friendly videojs-hls-quality-selector. If and when we are able to support TTML captions on the LivePlayer (which is always a DRM stream) without the use of videojs-contrib-dash, then we can likely consolidated quality level selectors under something like videojs-http-source-selector or similar. This is because videojs-contrib-dash interferes with libraries that make quality level detection possible (for our particular mix of HLS and DASH streams).

// Quality menu button with custom items and title
const MenuButton = videojs.getComponent('MenuButton');
const MenuItem = videojs.getComponent('MenuItem');
const Menu = videojs.getComponent('Menu');

interface CustomQualityMenuItemOptions extends videojs.MenuItemOptions {
  index: number;
  sortIndex: number;
}
class QualityLevelsItem extends MenuItem {
  constructor(player: VideoJsPBSPlayer, options: CustomQualityMenuItemOptions) {
    super(player, options);
    this.controlText(`${options.label}`);
  }

  handleClick() {
    // de-select all items
    const qualityLevelsButton = this.player()
      ?.getChild('controlBar')
      ?.getChild('QualityLevelsButton') as videojs.MenuButton;
    if (qualityLevelsButton) {
      const menuItems = qualityLevelsButton.menu.children_;
      for (const menuItem in menuItems) {
        const item = menuItems[menuItem] as videojs.MenuItem;
        item.selected(false);
      }
    }

    // select this menu item
    this.selected(true);

    if (this.player()) {
      // get this item's index and record it in the player object
      //@ts-ignore
      this.player().dashQualityLevelsSelected = this.options_.index;

      // trigger the special DASH functionality for auto switching
      this.player().trigger('dashQualityLevelsSelected', {
        autoSwitchBitrate: false,
      });
    }
  }
}

videojs.registerComponent('QualityLevelsItem', QualityLevelsItem);

// "Auto" option

class AutoOptionMenuItem extends MenuItem {
  constructor(player: VideoJsPBSPlayer, options) {
    super(player, options);
    this.controlText('Auto-switch quality levels');
  }

  // https://github.com/Dash-Industry-Forum/dash.js/issues/414
  handleClick() {
    this.selected(true);

    // de-select all other items
    const controlBar = this.player().getChild('controlBar');
    if (controlBar) {
      const qualityButton = controlBar.getChild(
        'QualityLevelsButton'
      ) as videojs.MenuButton;

      if (qualityButton) {
        const menuItems = qualityButton.menu.children_;
        for (const menuItem in menuItems) {
          const item: videojs.MenuItem = menuItems[
            menuItem
          ] as videojs.MenuItem;
          if (item.options_.label !== 'Auto') {
            item.selected(false);
          }
        }
      }
    }

    // trigger the special DASH functionality for auto switching
    this.player().trigger('dashQualityLevelsSelected', {
      autoSwitchBitrate: true,
    });
  }
}

videojs.registerComponent('AutoOptionMenuItem', AutoOptionMenuItem);

export class QualityLevelsButton extends MenuButton {
  private qualityLevels?: BitrateInfo[];

  constructor(
    player: VideoJsPBSPlayer,
    options: CustomComponentOptions,
    qualityLevels: BitrateInfo[]
  ) {
    super(player, options);

    this.qualityLevels = qualityLevels;
    if (qualityLevels) {
      MenuButton.call(this, player, options);
      this.controlText('Quality Menu');
      this.addClass('vjs-quality-selector');
      this.removeClass('vjs-hidden');
    }
  }

  buildCSSClass(): string {
    return 'vjs-quality-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button vjs-showing';
  }

  createMenu(): videojs.Menu {
    const menu = new Menu(this.player());
    const levels: BitrateInfo[] | undefined = this.qualityLevels;

    const qualityLevelsMenuTitle = new MenuItem(this.player(), {
      label: 'Quality',
      selectable: false,
      multiSelectable: false,
    });
    qualityLevelsMenuTitle.addClass('vjs-menu-title');
    qualityLevelsMenuTitle.removeClass('vjs-menu-item');

    // Menu Title "Quality"
    menu.addChild(qualityLevelsMenuTitle);

    // "Auto" option - always first in the list and selected by default
    const autoOption = new AutoOptionMenuItem(this.player(), {
      label: 'Auto',
      selectable: true,
      multiSelectable: false,
    });
    autoOption.selected(true);
    menu.addChild(autoOption);

    // Quality Levels available sorted from highest to lowest
    if (levels) {
      for (let i = levels.length - 1; i >= 0; i--) {
        const menuItem: QualityLevelsItem = new QualityLevelsItem(
          this.player(),
          {
            multiSelectable: false,
            selectable: true,
            label: levels[i].height + 'p',
            index: levels[i].qualityIndex,
            sortIndex: i,
          }
        );

        menu.addChild(menuItem);
      }
    }

    return menu;
  }
}
