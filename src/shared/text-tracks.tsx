import { VideoJsPlayer } from 'video.js';

export const getTextTracks = (player: VideoJsPlayer): TextTrackList => {
  return player && player.remoteTextTracks().length > 0
    ? player.remoteTextTracks()
    : player.textTracks();
};
