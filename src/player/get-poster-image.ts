import { Video } from '../bridge';
import { specifyResolution } from '../lib/images';

/**
 * Helper to get a video poster image
 */
export function getPosterImage(video: Video, _window = window): string {
  // just in case we don't get an image back
  if (!video.imageUrl) {
    return '';
  }

  const aspectRatio = 16 / 9;
  // There's currently a bug with iOS where window.outerWidth is 0.
  // We need to fallback to using window.innerWidth for iOS mobile.
  const width: number = _window.outerWidth || _window.innerWidth;
  const height: number = Math.ceil(width / aspectRatio);
  return specifyResolution(video.imageUrl, { width, height });
}
