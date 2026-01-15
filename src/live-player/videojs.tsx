import React, { useEffect, useRef } from 'react';
import 'videojs-contrib-eme';
import 'videojs-contrib-dash';

import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import { elements } from '../constants';
import { MuxOptions } from '../analytics/mux';
import { LivePlayerContext } from '../bridge';

export interface VideoJsProps extends VideoJsPlayerOptions {
  mounted?: () => void;
  context?: LivePlayerContext;
}

export interface PBSPlayerLivestream extends VideoJsPlayer {
  //eslint-disable-next-line
  eme?: any; // Support for Encrypted Media Extension (EME) playback of DRM'd content
  //eslint-disable-next-line
  dash?: any; // Dash plugin with TTML caption support
  mux?: (arg0: MuxOptions) => void;
}

// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
// typescript implementation for videoJS adapted from https://gist.github.com/hamishrouse/4be2f37987cfe4af6a2c8a99e0ab5988

const VideoJsLiveStreamPlayer: React.FC<VideoJsProps> = (props) => {
  const videoNodeRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PBSPlayerLivestream>();

  useEffect(() => {
    const { mounted, children, ...videoJsOpts } = props;
    if (videoNodeRef.current) {
      playerRef.current = videojs(
        videoNodeRef.current,
        videoJsOpts,
        function onPlayerReady() {
          // since we extend the type with generic <T>, this function could be optional
          if (mounted) mounted();
        }
      ) as PBSPlayerLivestream;
      // Initialize the EME plugin for potential DRM content
      // Without this line, non-DASH streams would not be able to reach the keysystems needed to
      // decrypt the DRM stream and the player would fail.
      // Since most (if not all) GA Livestreams use DRM, we always initialize this plugin.
      if (typeof playerRef.current.eme === 'function') {
        playerRef.current.eme();
      }
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      const { poster } = props;
      playerRef.current.poster(poster as string);
    }
  }, [props.poster]);

  const { context } = props;
  // the 'micro-layout' class applies to the tiny video that floats down into the corner of the screen on scroll;
  // this is only applicable to portal player (pbs.org) and station player (SVPs) where that feature exists.
  const microLayoutClass =
    context?.playerType === 'ga_livestream_portal_player' ||
    context?.playerType === 'ga_livestream_station_player'
      ? ' micro-layout'
      : '';

  const customClassnames = `vjs-pbs video-js vjs-big-play-centered${microLayoutClass}`;

  return (
    <video
      id={elements.livePlayer}
      ref={videoNodeRef}
      className={customClassnames}
      playsInline
    ></video>
  );
};

export default VideoJsLiveStreamPlayer;
