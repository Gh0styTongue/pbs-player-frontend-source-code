import videojs from 'video.js';

// Default options for the plugin.
const defaults = {};

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;
// const dom = videojs.dom || videojs;

/**
 * VideoJS HLS Quality Selector Plugin class.
 */
class HlsQualitySelectorPlugin {
  /**
   * Plugin Constructor.
   *
   * @param {Player} player - The videojs player instance.
   * @param {Object} options - The plugin options.
   */
  constructor(player, options) {
    this.player = player;
    this.config = options;

    // If there is quality levels plugin and the HLS tech exists
    // then continue.
    if (this.player.qualityLevels && this.getHls()) {
      // Create the quality button.
      this.createQualityButton();
      this.bindPlayerEvents();
    }
  }

  /**
   * Returns HLS Plugin
   *
   * @return {*} - videojs-hls-contrib plugin.
   */
  getHls() {
    return this.player.tech({ IWillNotUseThisInPlugins: true }).vhs;
  }

  /**
   * Binds listener for quality level changes.
   */
  bindPlayerEvents() {
    this.player
      .qualityLevels()
      .on(
        'addqualitylevel',
        this.onAddQualityLevel.bind(
          this,
          this.config.sortAscending,
          this.config.autoPlacement
        )
      );
  }

  /**
   * Adds the quality menu button to the player control bar.
   */
  createQualityButton() {
    const player = this.player;

    this._qualityButton = new ConcreteButton(player);

    const placementIndex = player.controlBar.children().length - 2;
    const concreteButtonInstance = player.controlBar.addChild(
      this._qualityButton,
      { componentClass: 'qualitySelector' },
      this.config.placementIndex || placementIndex
    );

    concreteButtonInstance.addClass('vjs-quality-selector');
    if (!this.config.displayCurrentQuality) {
      const icon = ` ${this.config.vjsIconClass || 'vjs-icon-hd'}`;

      concreteButtonInstance.menuButton_.$('.vjs-icon-placeholder').className +=
        icon;
    } else {
      this.setButtonInnerText('auto');
    }
    concreteButtonInstance.removeClass('vjs-hidden');
  }

  /**
   *Set inner button text.
   *
   * @param {string} text - the text to display in the button.
   */
  setButtonInnerText(text) {
    this._qualityButton.menuButton_.$('.vjs-icon-placeholder').innerHTML = text;
  }

  /**
   * Builds individual quality menu items.
   *
   * @param {Object} item - Individual quality menu item.
   * @return {ConcreteMenuItem} - Menu item
   */
  getQualityMenuItem(item) {
    const player = this.player;

    return new ConcreteMenuItem(player, item, this._qualityButton, this);
  }

  /**
   * Executed when a quality level is added from HLS playlist.
   *
   * @param {boolean} sortAscending - sort quality levels, default is ascending.
   * @param {string} autoPlacement - place the 'auto' menu item at the 'top' or
   * 'bottom' (default).
   */
  onAddQualityLevel(sortAscending = true, autoPlacement = 'bottom') {
    const player = this.player;
    const qualityList = player.qualityLevels();
    const levels = qualityList.levels_ || [];
    const levelItems = [];
    const autoMenuItem = this.getQualityMenuItem.call(this, {
      label: player.localize('Auto'),
      value: 'auto',
      selected: true,
    });

    for (let i = 0; i < levels.length; ++i) {
      if (!levels[i].height) {
        continue;
      }
      if (
        !levelItems.filter((_existingItem) => {
          return (
            _existingItem.item && _existingItem.item.value === levels[i].height
          );
        }).length
      ) {

        let qualityItemLabel = levels[i].height + 'p';

        // Special handling for labeling 4K and HD resolutions
        if (levels[i].height === 2160) {
          qualityItemLabel += ' 4K';
        } else if (levels[i].height >= 720 && levels[i].height < 2160) {
          qualityItemLabel += ' HD';
        }

        const levelItem = this.getQualityMenuItem.call(this, {
          label: qualityItemLabel,
          value: levels[i].height,
        });

        levelItems.push(levelItem);
      }
    }

    // sort the quality level values
    if (sortAscending) {
      levelItems.sort((current, next) => {
        if (typeof current !== 'object' || typeof next !== 'object') {
          return -1;
        }
        return current.item.value - next.item.value;
      });
    } else {
      levelItems.sort((current, next) => {
        if (typeof current !== 'object' || typeof next !== 'object') {
          return -1;
        }
        return next.item.value - current.item.value;
      });
    }

    if (this._qualityButton) {
      this._qualityButton.createItems = function () {
        // put 'auto' at the top or bottom per option parameter
        return autoPlacement === 'top'
          ? [autoMenuItem, ...levelItems]
          : [...levelItems, autoMenuItem];
      };
      this._qualityButton.update();
    }
  }

  /**
   * Sets quality (based on media height)
   *
   * @param {number} height - A number representing HLS playlist.
   */
  setQuality(height) {
    const qualityList = this.player.qualityLevels();

    // Set quality on plugin
    this._currentQuality = height;

    if (this.config.displayCurrentQuality) {
      this.setButtonInnerText(height === 'auto' ? height : `${height}p`);
    }

    for (let i = 0; i < qualityList.length; ++i) {
      const quality = qualityList[i];

      quality.enabled = quality.height === height || height === 'auto';
    }
    this._qualityButton.unpressButton();
  }

  /**
   * Return the current set quality or 'auto'
   *
   * @return {string} the currently set quality
   */
  getCurrentQuality() {
    return this._currentQuality || 'auto';
  }
}

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options) => {
  player.addClass('vjs-hls-quality-selector');
  player.hlsQualitySelector = new HlsQualitySelectorPlugin(player, options);
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function hlsQualitySelector
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const hlsQualitySelector = function (options) {
  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });
};

// Register the plugin with video.js.
registerPlugin('hlsQualitySelector', hlsQualitySelector);

// --------------------------------------------------------
const VideoJsButtonClass = videojs.getComponent('MenuButton');
const VideoJsMenuClass = videojs.getComponent('Menu');
const VideoJsComponent = videojs.getComponent('Component');
const Dom = videojs.dom;

/**
 * Convert string to title case.
 *
 * @param {string} string - the string to convert
 * @return {string} the returned titlecase string
 */
function toTitleCase(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Extend vjs button class for quality button.
 */
export class ConcreteButton extends VideoJsButtonClass {
  /**
   * Button constructor.
   *
   * @param {Player} player - videojs player instance
   */
  constructor(player) {
    super(player, {
      title: player.localize('Quality'),
      name: 'QualityButton',
    });
  }

  /**
   * Creates button items.
   *
   * @return {Array} - Button items
   */
  createItems() {
    return [];
  }

  /**
   * Create the menu and add all items to it.
   *
   * @return {Menu}
   *         The constructed menu
   */
  createMenu() {
    const menu = new VideoJsMenuClass(this.player_, { menuButton: this });

    this.hideThreshold_ = 0;

    // Add a title list item to the top
    if (this.options_.title) {
      const titleEl = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.options_.title),
        tabIndex: -1,
      });
      const titleComponent = new VideoJsComponent(this.player_, {
        el: titleEl,
      });

      this.hideThreshold_ += 1;

      menu.addItem(titleComponent);
    }

    this.items = this.createItems();

    if (this.items) {
      // Add menu items to the menu
      for (let i = 0; i < this.items.length; i++) {
        menu.addItem(this.items[i]);
      }
    }

    return menu;
  }
}

// ---------------------------------------------------------------
// Concrete classes
const VideoJsMenuItemClass = videojs.getComponent('MenuItem');

/**
 * Extend vjs menu item class.
 */
export class ConcreteMenuItem extends VideoJsMenuItemClass {
  /**
   * Menu item constructor.
   *
   * @param {Player} player - vjs player
   * @param {Object} item - Item object
   * @param {ConcreteButton} qualityButton - The containing button.
   * @param {HlsQualitySelectorPlugin} plugin - This plugin instance.
   */
  constructor(player, item, qualityButton, plugin) {
    super(player, {
      label: item.label,
      selectable: true,
      selected: item.selected || false,
    });
    this.item = item;
    this.qualityButton = qualityButton;
    this.plugin = plugin;
  }

  /**
   * Click event for menu item.
   */
  handleClick() {
    // Reset other menu items selected status.
    for (let i = 0; i < this.qualityButton.items.length; ++i) {
      this.qualityButton.items[i].selected(false);
    }

    // Set this menu item to selected, and set quality.
    this.plugin.setQuality(this.item.value);
    this.selected(true);
  }
}

export default hlsQualitySelector;
