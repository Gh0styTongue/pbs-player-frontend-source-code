import { LivePlayerContext } from '../bridge';
import { VideoJsPlayerOptions } from 'video.js';
import * as detect from '../lib/detect';
import { livePlayerGetSources } from './live-player-get-sources';
import { getPosterImage } from './live-player-get-poster-image';

const isSafari = detect.isSafari();

/**
 * Player DRM Helper Code
 *
 * DRM content will be decrypted with the videojs-contrib-eme plugin and use the appropriate platform-dependent keysystem:
 * - DASH stream with Widevine licenses for Chrome/Firefox/Edge/Chromium-based/etc.
 * - HLS with Fairplay licenses for macOS Safari and iOS Safari
 */
export function getLivePlayerOptions(
  context: LivePlayerContext
): VideoJsPlayerOptions {
  /* If autoplay is true, the video will start playing as soon as page is loaded (without any interaction from the user). NOT SUPPORTED BY APPLE iOS DEVICES. Apple blocks the autoplay functionality in an effort to protect it's customers from unwillingly using a lot of their (often expensive) monthly data plans. A user touch/click is required to start the video in this case.

  Additionally, this is no guarantee that your video will start autoplaying - browsers may ignore the attribute in a way that we can't detect.

  https://videojs.com/guides/options/#autoplay */
  const autoPlayValue = (): boolean => {
    if (
      (context.options?.feedCid !== undefined &&
      context.options?.channelSwitch === true) ||
      context.options?.autoplay === true
    ) {
      return true
    } else {
      return false
    }
  }

  const livePlayerOptions = {
    sources: livePlayerGetSources(context, isSafari),
    controls: true,
    //@ts-ignore
    persistTextTrackSettings: true,
    html5: {
      dash: {
        // this enables the use of TTML captions AND lets us style them using our existing customization menu.
        useTTML: true,
      },
      // Note: Native captions cannot be styled using our UI, you need to use the OS-provided
      // menus typically found in macOS System Preferences > Accessibility > Captions
      nativeCaptions: isSafari ? true : false,
    },
    controlBar: {
      children: [
        'playToggle',
        'progressControl',
        'volumePanel',
        'seekToLive',
        'audioTrackButton',
        'fullscreenToggle',
      ],
      volumePanel: {
        inline: false,
      },
    },
    autoplay: autoPlayValue(),
    muted: context.options.muted,
    poster: getPosterImage(context),
    plugins: {},
    liveui: true,
    responsive: true,
    fluid: true,
    loop: false,
    aspectRatio: '16:9',
  };

  return livePlayerOptions;
}
