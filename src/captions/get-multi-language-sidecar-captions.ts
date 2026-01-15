import videojs from 'video.js';
import { MultipleLanguageCaptionsBridge, Video } from '../bridge';
import { filterSidecarCaptions } from './filter-sidecar-captions';
import { sortCaptionsByPrimary } from './sort-sidecar-captions';
import { getNativeName } from '../lib/get-native-name';

// Get sidecar "multiple language" captions
export function getMultipleLanguageSidecarCaptions(
  video: Video
): videojs.TextTrackOptions[] {
  const mulitipleLanguageCaptions:
    | MultipleLanguageCaptionsBridge[]
    | undefined = video.cc_multiple_languages;

  if (!mulitipleLanguageCaptions) {
    return [];
  }

  // prefer WebVTT, then try DFXP
  const filteredSidecarCaptions: MultipleLanguageCaptionsBridge[] =
    filterSidecarCaptions(mulitipleLanguageCaptions);

  // sort by primary "true"
  const sortedSidecarCaptions: MultipleLanguageCaptionsBridge[] =
    sortCaptionsByPrimary(filteredSidecarCaptions);

  // for each caption, use the language code to fetch the native name
  const parsedCaptions = sortedSidecarCaptions.map(
    (value: MultipleLanguageCaptionsBridge) => {
      const captionLabel: string = getNativeName(value.language);

      return {
        kind: 'captions' as videojs.TextTrack.Kind,
        label: captionLabel,
        srclang: value.language,
        src: value.url,
      };
    }
  );

  return parsedCaptions;
}
