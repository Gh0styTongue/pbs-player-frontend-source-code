import { MultipleLanguageCaptionsBridge } from '../bridge';

// Filters out non-WebVTT (or non-DFXP if WebVTT unavailable) sidecar captions from the CS response
export function filterSidecarCaptions(
  tracks: MultipleLanguageCaptionsBridge[]
): MultipleLanguageCaptionsBridge[] {
  const webVttCaptions = tracks.filter(
    (captionsObject: MultipleLanguageCaptionsBridge) =>
      captionsObject.profile === 'WebVTT'
  );
  if (webVttCaptions.length > 0) {
    return webVttCaptions;
  } else {
    const dfxpCaptions = tracks.filter(
      (captionsObject: MultipleLanguageCaptionsBridge) =>
        captionsObject.profile === 'DFXP'
    );
    return dfxpCaptions;
  }
}
