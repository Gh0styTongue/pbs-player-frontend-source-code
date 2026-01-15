import { isSafari } from './get-video-audio-metadata';

export const getDrmInfo = (): string | undefined => {
  if (isSafari) {
    // Fairplay for Safari
    return 'fairplay';
  }

  const drmSystem = (window as any).__drmKeySystemUsed;

  if (!drmSystem) {
    // No DRM detected
    return undefined;
  }

  // 'com.widevine.alpha',
  if (drmSystem.includes('widevine')) {
    return 'widevine';
  }

  // 'com.microsoft.playready',
  else if (drmSystem.includes('playready')) {
    return 'playready';
  } else {
    return drmSystem;
  }
};
