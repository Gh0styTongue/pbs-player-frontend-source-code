import videojs from 'video.js';
import { Video } from '../bridge';

// Get sidecar "single language" captions
export function getSingleLanguageSidecarCaptions(
  video: Video
): videojs.TextTrackOptions[] {
  const bestCaptionFile = video.cc.WebVTT || video.cc.DFXP;
  if (!bestCaptionFile) {
    return [];
  }

  return [
    {
      kind: 'captions',
      label: 'English',
      srclang: 'en',
      src: bestCaptionFile,
    },
  ];
}
