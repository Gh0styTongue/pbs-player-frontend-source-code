import videojs from 'video.js';
import { formatChapterTitle } from '../lib/format-chapter-title';
import { ChapterMarker } from '../lib/get-chapters';
import { VideoJsPBSPlayer } from '../player/player';

// Chapters menu button with custom items and title
const MenuItem = videojs.getComponent('MenuItem');
const MenuButton = videojs.getComponent('MenuButton');

class ChaptersMenuItem extends MenuItem {
  private chapterStartTime: number;

  constructor(
    player: VideoJsPBSPlayer,
    options: videojs.MenuItemOptions,
    chapterStartTime: number
  ) {
    super(player, options);
    this.controlText('Select Chapter');
    this.chapterStartTime = chapterStartTime;
  }

  handleClick() {
    // mark this chapter as selected in the menu
    this.selected(true);

    // bug: we have to manually loop through the menu items and deselect all others
    this.deselectOtherItems(this.chapterStartTime);

    // bug: chapter 1's start time of 0 comes in as undefined sometimes.
    if (this.chapterStartTime === undefined) {
      this.chapterStartTime = 0;
    }

    // jump the player to that time
    this.player().currentTime(this.chapterStartTime);
  }

  deselectOtherItems(chapterStartTime: number) {
    const controlBar = this.player().getChild('controlBar');
    if (controlBar) {
      const chapterSelectorButton = controlBar.getChild(
        'ChapterSelectorButton'
      ) as videojs.MenuButton;

      if (chapterSelectorButton) {
        const menuItems = chapterSelectorButton.menu.children_;
        for (const menuItem in menuItems) {
          const item = menuItems[menuItem] as ChaptersMenuItem;
          if (chapterStartTime !== item.chapterStartTime) {
            item.selected(false);
          }
        }
      }
    }
  }
}

videojs.registerComponent('ChaptersMenuItem', ChaptersMenuItem);

export class ChapterSelectorButton extends MenuButton {
  private chapterMarkers?: ChapterMarker[];

  constructor(
    player: VideoJsPBSPlayer,
    options: any, // eslint-disable-line
    chapterMarkers: ChapterMarker[]
  ) {
    super(player, options);

    // Setting chapterMarkers in 'this' needs to be done
    // before the MenuButton class 'call' or else createItems is called
    // too early and the menu will appear blank.
    this.chapterMarkers = chapterMarkers;

    MenuButton.call(this, player, options);

    this.controlText('Chapters Menu');
    this.addClass('vjs-chapter-selector');
  }

  buildCSSClass(): string {
    return `vjs-chapter-selector ${super.buildCSSClass()}`;
  }

  createItems(): videojs.MenuItem[] {
    const chapters = this.chapterMarkers;

    const chapterMenuTitle = new MenuItem(this.player(), {
      label: 'Chapters',
      selectable: false,
    });
    chapterMenuTitle.addClass('vjs-menu-title');
    chapterMenuTitle.removeClass('vjs-menu-item');

    if (chapters) {
      const chapterMenuItems = chapters.map(
        (chapter: ChapterMarker, index: number) => {
          // Display the chapter label as it comes from content service, but
          // if it's just a number followed by a period — e.g., "1." then only
          // return the number.

          let chapterLabel: string = chapter.text || '';

          // If for some reason the video's chapters have blank titles,
          // just display the index of the item in the list
          if (chapterLabel === '') {
            chapterLabel = (index + 1).toString();
          } else {
            chapterLabel = formatChapterTitle(chapterLabel);
          }

          return new ChaptersMenuItem(
            this.player(),
            {
              label: chapterLabel,
              selectable: true,
              multiSelectable: false,
            },
            chapter.time
          );
        }
      );

      return [chapterMenuTitle, ...chapterMenuItems];
    }

    return [chapterMenuTitle];
  }
}
