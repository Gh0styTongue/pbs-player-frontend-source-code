import { RelatedAccessibleVideoBridge, Video } from '../bridge';

export interface AccessibilitySource {
  sources: { src: string; type: string }[];
  label: string;
  poster: string;
  isDefault?: boolean;
}

// @TODO if more accessibility video options are added, we will need to update this list
// Per the description in https://projects.pbs.org/jira/browse/OCTO-10819,
// the options are non-enhanced, ead-english, ead-spanish, asl, oc-english, oc-spanish
const accesibleVideoProfilesToLabels = {
  asl: 'ASL',
  'ead-english': 'Extended Audio Description',
  // Thanks to Esteban Amas and Mateo Otalvaro for their help with the Spanish translations
  'ead-spanish': 'Descripciones de Sonido Extendidos',
  'non-enhanced': 'None',
  'oc-english': 'Open Captions',
  'oc-spanish': 'Subtítulos Abiertos',
};

export const playlistAccessibleVideosSources = (
  video: Video
): AccessibilitySource[] | null => {
  const { relatedAccessibilityVideos, slug } = video;

  if (!relatedAccessibilityVideos || relatedAccessibilityVideos.length === 0) {
    return null;
  } else {
    // @TODO if we end up needing DRM, we'll need to add the DASH type - "application/dash+xml"
    const hlsType = "application/x-mpegURL";
    const result: AccessibilitySource[] = []

    // first we need to get the related accessible videos into the list
    relatedAccessibilityVideos.forEach((accessibleVideo: RelatedAccessibleVideoBridge) => {
      // @TODO if we end up needing DRM, we'll need to look for an additional profile
      const profilesToUse = ["hls-16x9-1080p", "hls-16x9-720p"];
      // filter to the appropriate profiles in order of preference
      const videoSrcToUse = profilesToUse
        .map((profile) => accessibleVideo.hls_videos.find((video) => video.profile === profile))
        .filter((video) => video); // remove undefined values

      // if we have that profile, construct a playlist source object and add it to result
      if (videoSrcToUse.length > 0) {
        result.push({
          sources: [{
            src: videoSrcToUse[0]?.url || '',
            type: hlsType,
          }],
          // if this video matches the resource slug, that means it's the default video
          isDefault: accessibleVideo.slug === slug,
          // get a human readable label based on the accessibility profile
          label: accesibleVideoProfilesToLabels[accessibleVideo.accessibility_profile],
          poster: accessibleVideo.images['asset-mezzanine-16x9'],
        });
      }
    });

    return result;
  }
};
