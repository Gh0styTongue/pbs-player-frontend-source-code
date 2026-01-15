import React, {useEffect, useRef } from 'react';
import videojs, { VideoJsPlayerOptions } from 'video.js';
import { elements } from '../constants';
import { getAdvertisingOptions } from '../advertisement/get-advertising-options';
import { VideoJsPBSPlayer as VideoJsPBSPlayerInterface } from './player';

import 'videojs-contrib-ads';
import 'videojs-contrib-eme';
import 'videojs-ima';
import { Context, Video } from '../bridge';

export interface VideoJsProps extends VideoJsPlayerOptions {
  mounted?: () => void;
  video?: Video;
  context?: Context;
}

// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
// typescript implementation for videoJS adapted from https://gist.github.com/hamishrouse/4be2f37987cfe4af6a2c8a99e0ab5988

const VideoJsPBSPlayer: React.FC<VideoJsProps> = (props) => {
  const playerRef = useRef<VideoJsPBSPlayerInterface>();
  const videoNodeRef = useRef<HTMLVideoElement>(null);
  const { mounted, video, context, children, ...videoJsOpts } = props;

  useEffect(() => {
    if (videoNodeRef.current) {
      playerRef.current = videojs(
        videoNodeRef.current,
        videoJsOpts,
        function onPlayerReady() {
          // since we extend the type with generic <T>, this function could be optional
          if (mounted) mounted();
        }
      );

      // PLYR-562 DRM Encrypted Media Extensions plugin
      // Only initialized if the video has DRM
      if (video?.hasDrm && typeof playerRef.current.eme === 'function') {
        playerRef.current.eme();
      }
    }

    // -----------------------------------------------------
    // Ads + Google IMA SDK

    const adOptions = video && context && getAdvertisingOptions(video, context);
    if (
      playerRef.current &&
      playerRef.current.ima !== undefined &&
      adOptions
    ) {
      // check for adOptions otherwise will fail in local dev.
      playerRef.current.ima(adOptions);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [mounted, video, context, videoJsOpts]);

  // the 'micro-layout' class applies to the tiny video that floats down into the corner of the screen on scroll;
  // this is only applicable to portal player (pbs.org) and station player (SVPs) where that feature exists.
  const microLayoutClass =
    context?.playerType === 'station_player' ||
    context?.playerType === 'portal_player'
      ? ' micro-layout'
      : '';

  const customVideoClasses = `vjs-pbs video-js vjs-big-play-centered${microLayoutClass}`;

  return (
    <video
      id={elements.player}
      ref={videoNodeRef}
      className={customVideoClasses}
      playsInline
    ></video>
  );
};

export default VideoJsPBSPlayer;
