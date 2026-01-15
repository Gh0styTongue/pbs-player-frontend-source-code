import { LivePlayerContext } from '../bridge';
import { adjustProtocol } from '../lib/url';

const dashBasedSources = (context: LivePlayerContext) => {
  return [
    {
      src: context.drmDashUrl as string,
      type: 'application/dash+xml',
      keySystemOptions: [
        {
          name: 'com.widevine.alpha',
          options: {
            serverURL: context.drmWidevineLicenseUrl,
            priority: 1,
          },
        },
        {
          name: 'com.microsoft.playready',
          options: {
            serverURL: context.drmPlayreadyLicenseUrl,
            priority: 2,
          },
        },
      ],
    },
  ];
};

// DRM keySystem info for Safari
const fairplayCertificateUri = `https://static.drm.pbs.org/fairplay-cert`;

// Source object for Apple platforms, which require HLS streams with Fairplay
// eslint-disable-next-line
const hlsBasedSources = (context: LivePlayerContext) => {
  return [
    {
      src: context.drmHlsUrl as string,
      type: 'application/x-mpegURL',
      keySystems: {
        'com.apple.fps.1_0': {
          //@ts-ignore
          getContentId: function (emeOptions, initData) {
            const skd_uri = String.fromCharCode.apply(
              null,
              //@ts-ignore
              new Uint16Array(initData.buffer)
            );
            return skd_uri;
          },
          certificateUri: fairplayCertificateUri,
          licenseUri: context.drmFairplayLicenseUrl,
        },
      },
    },
  ];
};

// PLYR-646 fallback for when the ga-main field has non_drm_url
// because this gets evaluated every time, we check for context.nonDrmUrl first
const nonDrmUrlSources = (context: LivePlayerContext) => {
  return context.nonDrmUrl
    ? [
        {
          src: adjustProtocol(context.nonDrmUrl as string),
          type: 'application/x-mpegURL',
          keySystemOptions: [],
        },
      ]
    : [];
};

const oldLivestreamSources = (context) => {
  return [
    {
      src: adjustProtocol(context.gaLiveStreamUrl),
      type: 'application/x-mpegURL',
      keySystemOptions: [],
    },
  ];
};

// @TODO give a return type on this - yikes
// eslint-disable-next-line
export const livePlayerGetSources = (
  context: LivePlayerContext,
  isSafari: boolean
) => {
  const hasDrmFeed = context.hasDrmFeed;
  // Note - the checks for `null` have to be here, because there are times
  // when these values will be set to null upstream
  switch (true) {
    // for Dash / Widevine streams
    case hasDrmFeed && !isSafari && context.drmDashUrl !== null:
      return dashBasedSources(context);
    // for Safari / HLS based streams
    case hasDrmFeed && isSafari && context.drmHlsUrl !== null:
      return hlsBasedSources(context);
    // PLYR-646 falling back to non_drm_url field
    case context.nonDrmUrl !== null && context.nonDrmUrl !== undefined:
      return nonDrmUrlSources(context);
    // Failing everything else, serve up the old static feed
    default:
      return oldLivestreamSources(context);
  }
};
