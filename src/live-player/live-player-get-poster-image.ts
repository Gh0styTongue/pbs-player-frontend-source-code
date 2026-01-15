import { LivePlayerContext } from '../bridge';
import { specifyResolution } from '../lib/images';

/**
 * Helper to get a video poster image
 */
export function getPosterImage(
  context: LivePlayerContext,
  _window = window
): string {
  // just in case we don't get an image back
  // OR
  // if we have a feedCid (which means we're dealing with multilivestreams)
  // AND the channel_swtich query param is set to true,
  // return an empty string
  if (
    !context.imageUrl ||
    (context.options.feedCid !== undefined && context.options.channelSwitch === true)) {
    return '';
  }

  const aspectRatio = 16 / 9;
  // There's currently a bug with iOS where window.outerWidth is 0.
  // We need to fallback to using window.innerWidth for iOS mobile.
  const width: number = _window.outerWidth || _window.innerWidth;
  const height: number = Math.ceil(width / aspectRatio);
  return specifyResolution(context.imageUrl, { width, height });
}
