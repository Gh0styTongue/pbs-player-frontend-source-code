import { Video, Context, RelatedVideoBridge } from '../bridge';

export const getVideoShareUrl = (
  video: Video,
  context: Context,
  document_ = document
): string => {
  const videoSlugUrl = `https://www.pbs.org/video/${video.slug}/`;

  if (
    // drive viral player content back to pbs.org
    context.playerType === 'viral_player' ||
    // or, if the producer site has a referrer policy of
    // 'strict-origin-when-cross-origin', which means the
    // referrer is just the origin
    document_.referrer === 'https://www.pbs.org/' ||
    !document_.referrer
  ) {
    return videoSlugUrl;
  } else {
    // otherwise, link to the "hosting" page (e.g., producer site)
    return document_.referrer;
  }
};

export const getRelatedShowUrl = (video: RelatedVideoBridge): string => {
  if (video.program && video.program.slug) {
    const slug: string = video.program.slug;
    return `https://www.pbs.org/show/${slug}/`;
  } else {
    return 'https://www.pbs.org/';
  }
};

export const getRelatedVideoUrl = (video: RelatedVideoBridge): string => {
  return `https://www.pbs.org/video/${video.slug}/`;
};
