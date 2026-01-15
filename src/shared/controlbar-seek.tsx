import videojs from 'video.js';
import { PBSPlayerLivestream } from '../live-player/videojs';
import { VideoJsPBSPlayer, CustomComponentOptions } from '../player/player';

// This is throwing a deprecation warning against getComponent('Button') when in fact it should not
const Button = videojs.getComponent('Button');
export class SeekButton extends Button {
  constructor(
    player: VideoJsPBSPlayer | PBSPlayerLivestream,
    options: CustomComponentOptions
  ) {
    super(player, options);
    this.controlText('Rewind 10 Seconds');
  }

  buildCSSClass(): string {
    return `vjs-pbs-back-10 ${super.buildCSSClass()}`;
  }

  handleClick(): void {
    const currentTime = this.player().currentTime();
    this.player().currentTime(currentTime - 10);
  }
}
