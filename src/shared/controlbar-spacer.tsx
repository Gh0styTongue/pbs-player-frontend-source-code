import videojs, { VideoJsPlayer } from 'video.js';
import { VideoJsPBSPlayer, CustomComponentOptions } from '../player/player';

export class Spacer extends videojs.getComponent('Spacer') {
  constructor(
    player: VideoJsPBSPlayer | VideoJsPlayer,
    options: CustomComponentOptions
  ) {
    super(player, options);
  }
}
