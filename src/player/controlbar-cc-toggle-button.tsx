// This special captions button will toggle on/off the first English text track (captions or subtitles) that it encounters. Does not support multiple languages.

import videojs from 'video.js';
import { VideoJsPBSPlayer } from '../player/player';

const Button = videojs.getComponent('Button');

export class CaptionsToggleButton extends Button {
  constructor(player: VideoJsPBSPlayer, options: any) {
    super(player, options);
    this.controlText('Closed Captions');
    // Set the caption button icon's initial state
    this.updateIcon();
    // Listen for track change events to keep the button in sync
    this.on(player, 'texttrackchange', this.updateIcon);
  }

  buildCSSClass() {
    return `vjs-captions-toggle-button ${super.buildCSSClass()}`;
  }

  handleClick() {
    const tracks = this.player().textTracks();

    // Toggle the first English text track that we find and exit the loop
    for (let i = 0; i < tracks.length; i++) {
      if ((tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') && tracks[i].language === 'en') {
        if (tracks[i].mode === 'showing') {
          tracks[i].mode = 'disabled';
        } else {
          tracks[i].mode = 'showing';
        }
        this.updateIcon();
        break;
      }
    }
  }

  updateIcon() {
    const tracks = this.player().textTracks();
    let captionsShowing = false;

    // Check if any English caption track is showing
    for (let i = 0; i < tracks.length; i++) {
      if (
        (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') &&
        tracks[i].language === 'en' &&
        tracks[i].mode === 'showing'
      ) {
        captionsShowing = true;
        break;
      }
    }

    if (captionsShowing) {
      this.removeClass('vjs-captions-off');
      this.addClass('vjs-captions-on');
    } else {
      this.removeClass('vjs-captions-on');
      this.addClass('vjs-captions-off');
    }
  }
}

videojs.registerComponent('CaptionsToggleButton', CaptionsToggleButton);
