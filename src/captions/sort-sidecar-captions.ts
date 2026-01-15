import { MultipleLanguageCaptionsBridge } from '../bridge';

// Sorts sidecar captions by primary "true" so that it is always first in the menu
export function sortCaptionsByPrimary(
  tracks: MultipleLanguageCaptionsBridge[]
): MultipleLanguageCaptionsBridge[] {
  return tracks.sort(
    (a: MultipleLanguageCaptionsBridge, b: MultipleLanguageCaptionsBridge) => {
      return Number(b.primary) - Number(a.primary);
    }
  );
}
