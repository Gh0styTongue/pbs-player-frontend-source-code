import videojs, { VideoJsPlayer } from 'video.js';
import * as captionsStore from '../captions/store';
import { Dispatch } from 'redux';

const CaptionSettingsMenuItem = videojs.getComponent('CaptionSettingsMenuItem');

export class CaptionsCustomizeMenuItem extends CaptionSettingsMenuItem {
  private modal?: videojs.ModalDialog;
  private dispatch?: Dispatch;

  constructor(
    player: VideoJsPlayer,
    options: videojs.CaptionSettingsMenuItemOptions,
    modal: videojs.ModalDialog,
    dispatch: Dispatch
  ) {
    // inherit all functionality from the superclass
    super(player, options);

    this.controlText('Open Captions Settings');
    this.modal = modal;
    this.dispatch = dispatch;
  }

  handleClick() {
    if (this.dispatch && this.modal) {
      this.dispatch(captionsStore.launchCaptionsModal(this.modal));
    }
  }
}
