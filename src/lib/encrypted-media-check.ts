import { VideoJsPBSPlayer } from '../player/player';
import { PBSPlayerLivestream } from '../live-player/videojs';
import { Dispatch } from 'redux';

export const encryptedMediaCheck = (
  player: VideoJsPBSPlayer | PBSPlayerLivestream,
  dispatch: Dispatch,
  errorHandler: (arg0: VideoJsPBSPlayer, arg1: Dispatch) => void
): void => {
  // We're mostly concerned with catching errors, so these
  // values aren't super important
  const clearKeyOptions = [
    {
      initDataTypes: [],
      audioCapabilities: [
        {
          contentType: 'audio/mp4;codecs="mp4a.40.2"',
          robustness: 'SW_SECURE_CRYPTO'
        },
      ],
      videoCapabilities: [
        {
          contentType: 'video/mp4;codecs="avc1.42E01E"',
          robustness: 'SW_SECURE_CRYPTO'
        },
      ],
    },
  ];

  const originalRequestAccess = navigator.requestMediaKeySystemAccess;

  (window as any).__drmKeySystemUsed = null;

  navigator.requestMediaKeySystemAccess = async function (keySystem, config) {
    (window as any).__drmKeySystemUsed = keySystem;
    return originalRequestAccess.call(this, keySystem, config);
  };

  if (
    navigator.requestMediaKeySystemAccess &&
    typeof navigator.requestMediaKeySystemAccess === 'function'
  ) {
    navigator
      .requestMediaKeySystemAccess('com.widevine.alpha', clearKeyOptions)
      .catch(() => {
        // @TODO - decide if we want to keep this after DRM settles down
        // eslint-disable-next-line
        console.warn('Browser failed encrypted media check (widevine).');
        errorHandler(player, dispatch);
      });
  }
};
