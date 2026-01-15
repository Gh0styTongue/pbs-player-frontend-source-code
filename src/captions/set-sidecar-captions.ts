import videojs from 'video.js';

import { getMultipleLanguageSidecarCaptions } from './get-multi-language-sidecar-captions';
import { getSingleLanguageSidecarCaptions } from './get-single-language-sidecar-captions';
import { Video } from '../bridge';

// This function will return multiple language sidecar captions if present, otherwise it falls back to returning single language sidecar captions.
export const setPlayerSidecarCaptions = (
  video: Video
): videojs.TextTrackOptions[] => {
  const multipleLanguageCaptions: videojs.TextTrackOptions[] =
    getMultipleLanguageSidecarCaptions(video);

  // Add the TextTrackOptions[] to the Player instance
  // Fallback to single language captions when the CS response for multiple language captions is empty.
  if (multipleLanguageCaptions.length > 0) {
    return multipleLanguageCaptions;
  } else {
    return getSingleLanguageSidecarCaptions(video);
  }
};
