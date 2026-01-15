import { VideoJsPBSPlayer } from '../player/player';

/**
 * Determine if the current player instance is playing a livestream video
 */
export const isLivestream = (player: VideoJsPBSPlayer): boolean => {
  // https://docs.videojs.com/docs/api/player.html#Methodsduration

  const streamDuration = player && player.duration();
  const isDVR = streamDuration <= 0;
  const isLive = !isFinite(streamDuration);
  return isDVR || isLive;
};
