import { Video, Context } from '../bridge';

export interface ProfileRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string;
}

const getPlatformSlug = (context: Context): string => {
  // Portalplayer and stationplayer use the pbsorg slug, because we want to
  // share watchlist and viewing history between station video portals and pbs.org
  const playerType = context.playerType;
  if (playerType === 'portal_player' || playerType === 'station_player') {
    return 'pbsorg';
  }
  // Both partnerplayer and viralplayer use the partnerplayer slug
  return 'partnerplayer';
};

export const getAddToViewingHistoryRequest = (
  video: Video,
  context: Context,
  timecode: number
): ProfileRequest => {
  return {
    url: `/api/users/${context.userId}/viewing-history/${video.cid}/`,
    method: 'post',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      method: 'PUT',
      platform_slug: getPlatformSlug(context),
      timecode: Math.round(timecode),
    }),
  };
};

/**
 * Add a video to a user's viewing history
 */
export const addToViewingHistory = (
  video: Video,
  context: Context,
  timecode: number,
  params?: { useBeacon: boolean }
): void => {
  if (!context.userId) {
    return;
  }

  const request = getAddToViewingHistoryRequest(video, context, timecode);
  if (params && params.useBeacon) {
    navigator.sendBeacon(request.url, request.body);
  } else {
    fetch(request.url, request)
      .then((response) => {
        if (!response.ok) {
          throw response;
        }
      })
      .catch((error) => {
        // PLYR-627 adding console error with the hope that we can see why
        // this is failing for users
        // eslint-disable-next-line
        console.error('There was a problem updating viewing history:', error);
      });
  }
};

export const getRemoveFromHistoryPayload = (
  video: Video,
  context: Context
): ProfileRequest => {
  return {
    url: `/api/users/${context.userId}/viewing-history/${video.cid}/`,
    method: 'post',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      method: 'DELETE',
      platform_slug: getPlatformSlug(context),
    }),
  };
};

/**
 * Remove a video from a user's viewing history
 */
export const removefromViewingHistory = (
  video: Video,
  context: Context,
  params?: { useBeacon: boolean }
): void => {
  if (!context.userId) {
    return;
  }

  const request = getRemoveFromHistoryPayload(video, context);
  if (params && params.useBeacon) {
    navigator.sendBeacon(request.url, request.body);
  } else {
    fetch(request.url, request);
  }
};
