import { Video, Context } from '../bridge';
import videojs, { VideoJsPlayerOptions } from 'video.js';
import * as detect from '../lib/detect';
import { UrsData } from '../lib/urs';
import { playerGetSources } from './player-get-sources';
import { isSourceLive } from './is-source-live';
import { getPosterImage } from './get-poster-image';
import { setPlayerSidecarCaptions } from '../captions/set-sidecar-captions';

const isSafari = detect.isSafari();

const getControlbarChildren = (
  isLive: boolean,
): videojs.Child[] => {
  return isLive
    ? //  VOD Livestreams - show the specific set of controlbar children required to have the live UI.
      [
        'progressControl', // 0
        'playToggle', // 1
        'customControlsSpacer', // rewind 10 seconds --> 2
        'volumePanel', // 3
        'seekToLive', // 4
        'customControlsSpacer', // ----- spacer ------ 5
        'customControlsSpacer', // closed captions 6
        'audioTrackButton', // 7
        'fullscreenToggle', // 8
      ]
    : // All other VOD assets use this list
      [
        'progressControl', // 0
        'playToggle', // 1
        'customControlsSpacer', // rewind 10 seconds --> 2
        'volumePanel', // 3
        'currentTimeDisplay', // 4
        'timeDivider', // 5
        'durationDisplay', // 6
        // ------------------
        'customControlsSpacer', // spacer 7
        'customControlsSpacer',
        // ------------------
        // Enhanced Accessibility
        'audioTrackButton',
        'customControlsSpacer',
        'customControlsSpacer',
        'customControlsSpacer',
        'customControlsSpacer',
        'fullscreenToggle',
      ]
};

// We need to continue to support sidecar captions for DRM and MP4-only assets
const getSidecarCaptions = (video: Video): videojs.TextTrackOptions[] => {
  // Checks for multi-cc and falls back to single language if multi-cc is empty
  const sidecarCaptions = setPlayerSidecarCaptions(video);
  return sidecarCaptions;
};
export function getPlayerSetupOptions(
  data: UrsData[],
  video: Video,
  context: Context
): VideoJsPlayerOptions {
  const isLive = isSourceLive(data);

  const { relatedAccessibilityVideos } = video;

  const hasAccessibleVideos = (
      relatedAccessibilityVideos &&
      relatedAccessibilityVideos.length > 0
  )

  const playerOptions: VideoJsPlayerOptions = {
    // if we have accessible videos, return undefined so that we aren't double-downloading resources
    // we use the default video in the first spot in the playlist anyway
    sources: !hasAccessibleVideos
      ? playerGetSources(video, isSafari, data)
      : undefined,
    controls: true,
    controlBar: {
      children: getControlbarChildren(isLive),
      volumePanel: {
        inline: false,
      },
    },
    // By default, VOD player does not have livestreams; however, for special events like the Impeachment Hearings
    // and DNC / RNC we may use the VOD player to show a livestream. In that case, we will want to show the liveui.
    liveui: isLive,
    /* If autoplay is true, the video will start playing as soon as page is loaded (without any interaction from the user). NOT SUPPORTED BY APPLE iOS DEVICES. Apple blocks the autoplay functionality in an effort to protect it's customers from unwillingly using a lot of their (often expensive) monthly data plans. A user touch/click is required to start the video in this case.
    https://docs.videojs.com/docs/guides/options.html */
    autoplay: false,
    muted: context.options.muted,
    // If we have accessible videos, we want '' for the poster image
    // so that we prevent an unplesant double render of the poster image.
    // videojs-playlist version 5.0.1 tried to fix this, but it actually broke poster images for the whole playlist.
    // @TODO if videojs-playlist > 5.1.0 has a fix for the regression, we can try to see if this works without the work around.
    poster: !hasAccessibleVideos ? getPosterImage(video) : '',
    //@ts-ignore
    persistTextTrackSettings: true,
    // Note: Native captions cannot be styled using our UI, you need to use the OS-provided
    // menus typically found in macOS System Preferences > Accessibility > Captions
    html5: { nativeCaptions: isSafari ? true : false },
    plugins: {},
    preload: 'auto',
    responsive: true,
    breakpoints: {
      // We reduce the max-width breakpoint of vjs-layout-large and by extension we set a new min-width for vjs-layout-x-large. The rest of the breakpoints remain at their defaults: https://videojs.com/guides/layout/#customizing-breakpoints
      large: 1024,
    },
    playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
    loop: false,
    fluid: true,
    // https://projects.pbs.org/jira/browse/PLYR-453
    // Defining the aspect ratio that we are assuming for our player - which, in all cases, we want to be 16:9. This means that old 4x3 content will
    // be displayed with black bars on the sides.
    aspectRatio: '16:9',
  };

  if ((video.hasMp4Encodings && !video.hasHlsEncodings) || video.hasDrm) {
    playerOptions.tracks = getSidecarCaptions(video);
  }

  return playerOptions;
}
