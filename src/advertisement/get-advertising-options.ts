import { Video, Context } from '../bridge';
import env from '../environment';
import { elements } from '../constants';
import { getImaTag } from '../advertisement/ima';

export interface AdvertisingOptions {
  id: string;
  adTagUrl: string;
  adLabel?: string;
  showCountdown?: boolean;
  debug?: boolean;
  adsRenderingSettings?: Record<string, unknown>;
}

export function getAdvertisingOptions(
  video: Video,
  context: Context,
  environ = env
): AdvertisingOptions | undefined {
  return video.canPlayPreroll &&
    !environ.DEV &&
    !context.options.unsafeDisableSponsorship
    ? {
        // It's important to not mention ads or advertisement
        // directly, because of rights and legal resitrictions.
        // We have to refer to them as "messages".
        id: elements.player,
        adTagUrl: getImaTag(context, video),
        adLabel: 'Message',
        showCountdown: true,
        debug: false,
      }
    : undefined;
}
