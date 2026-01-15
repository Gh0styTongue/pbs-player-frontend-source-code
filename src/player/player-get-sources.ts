import { Video } from '../bridge';
import { UrsData } from '../lib/urs';
import { adjustProtocol } from '../lib/url';

const dashBasedSources = (video: Video) => {
  return [
    {
      src: video.dashDrmVideo?.url as string,
      type: 'application/dash+xml',
      keySystemOptions: [
        {
          name: 'com.widevine.alpha',
          options: {
            serverURL: video.dashDrmVideo?.widevine_license,
            priority: 1,
          },
        },
        {
          name: 'com.microsoft.playready',
          options: {
            serverURL: video.dashDrmVideo?.playready_license,
            priority: 2,
          },
        },
      ],
    },
  ];
};

// Source object for Apple platforms, which require HLS streams with Fairplay
const hlsBasedSources = (video: Video) => {
  return [
    {
      src: video.hlsDrmVideo?.url as string,
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
          certificateUri: video.hlsDrmVideo?.fairplay_certificate,
          licenseUri: video.hlsDrmVideo?.fairplay_license,
        },
      },
    },
  ];
};

const nonDrmSources = (data) =>
  data
    .filter((d) => d.url)
    .map((d) => {
      const sourceURL: string = adjustProtocol(d.url || '');

      // set the source type so that videojs-contrib-hls can work with letting older browsers switch the source appropriately.
      // From https://stackoverflow.com/a/1203361
      const fileType: string = sourceURL.split('.').pop() || '';
      let sourceType = '';

      if (fileType === 'm3u8') {
        sourceType = 'application/x-mpegURL';
      } else if (fileType === 'mp4') {
        sourceType = 'video/mp4';
      }

      return {
        src: sourceURL,
        type: sourceType,
      };
    });

// eslint-disable-next-line
export const playerGetSources = (
  video: Video,
  isSafari: boolean,
  data: UrsData[]
) => {
  switch (true) {
    case video.hasDrm && isSafari:
      return hlsBasedSources(video);
    case video.hasDrm && !isSafari:
      return dashBasedSources(video);
    default:
      return nonDrmSources(data);
  }
};
