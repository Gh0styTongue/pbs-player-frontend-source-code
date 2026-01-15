import { captureException } from '@sentry/browser';
export interface ContinuousPlayData {
  slug: string;
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  imageUrl: string;
  isPassport?: boolean;
  isPlayable?: boolean;
}

// Letting "resp: any" through since we really could get anything back
// eslint-disable-next-line
export const parseContinuousPlayResp = (resp: any): ContinuousPlayData => {
  return {
    slug: resp.slug,
    title: resp.title,
    showTitle: resp.show_title,
    episodeTitle: resp.episode_title,
    imageUrl: resp.image_url,
    isPassport: resp.is_passport,
    isPlayable: resp.is_playable,
  };
};

export async function getContinuousPlayVideo(
  videoSlug: string,
  stationId: string,
  userId?: string
): Promise<ContinuousPlayData> {
  let url = `/api/videos/${videoSlug}/continuous-play/`;
  // don't include userId or stationId if they don't exist; this will trigger errors
  if (userId) {
    url += `?user_id=${userId}`;
  } else if (stationId) {
    url += `?station_id=${stationId}`;
  }
  const r = await fetch(url);
  const resp = await r.json();
  return parseContinuousPlayResp(resp);
}

export async function getContinuousPlayVideoPassport(
  videoSlug: string,
  stationId: string,
  userId?: string
): Promise<ContinuousPlayData> {
  let url = `/api/videos/${videoSlug}/continuous-play/?passport=true`;
  // don't include user_id or station_id if they don't exist; this will trigger errors
  if (userId) {
    url += `&user_id=${userId}`;
  } else if (stationId) {
    url += `&station_id=${stationId}`;
  }
  const r = await fetch(url);
  const resp = await r.json();
  return parseContinuousPlayResp(resp);
}

export const checkIfInServiceArea = async (
  stationID: string,
  latitude: number,
  longitude: number
): Promise<boolean> => {
  const url = `/check-service-area/${stationID}/${latitude}/${longitude}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `checkIfInServiceArea HTTP error! status: ${response.status}`,
      );
    }

    const answer = await response.json();
    return answer.is_in_service_area;
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Error checking if coordinates are in service area:', error);
    // Return false to indicate user is not in service area on error
    return false;
  }
};

export const checkIfIpAddressInServiceArea = async (
  stationID: string
): Promise<boolean> => {
  const url = `/check-ip-service-area/${stationID}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `checkIfIpAddressInServiceArea HTTP error! status: ${response.status}`,
      );
    }

    const answer = await response.json();
    return answer.ip_is_in_service_area;
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Error checking if IP address is in service area:', error);
    // Return false to allow fallback to geolocation instead of breaking the flow
    return false;
  }
};

export const frontendInstrumentation = async (msg: string): Promise<void> => {
  const url = `/instrumentation/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      keepalive: true, // need this to avoid interrupting call when user navigates off page
      body: msg,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    captureException(err);
    // eslint-disable-next-line no-console
    console.error(err);
  }
};
