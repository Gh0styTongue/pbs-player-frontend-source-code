/**
 * Global mount element ids
 */
export const elements = {
  // the root id used for all react renders for all players
  root: 'mount-root',
  // ids needed for the video components in video.js
  player: 'player-videojs',
  livePlayer: 'liveplayer-videojs',
};

/**
 * Number of seconds we need to give as wiggle room
 * to account for Continuous Play
 */
export const continuousPlayPadding = 1.2;

/**
 * Error messages
 */
export const errorMessages = {
  regionRestriction:
    "We're sorry, but this video is not available in your region due to rights restrictions.",
  defaults:
    "We're sorry, but there was an error playing this video. Please try again later.",
  livestreamError:
    "We're sorry, but there was an error playing the livestream. Please try again later.",
};

/**
 * GA Livestream - Location Request Screen
 */
export const locationRequest = {
  locationRequired: {
    header: 'Location Required for Live TV',
    message: 'Please enable location services to watch the livestream.',
  },
  geolocationNotSupported: 'Geolocation is not supported by your browser',
};

/**
 * URLs
 */
export const urls = {
  livestreamHelpUrl: `https://help.pbs.org/support/solutions/articles/12000069454-pbs-live-streaming-faq`,
  pbsHelpUrl: `https://help.pbs.org/support/home/`,
};

/**
 * Acceptable text track labels
 */

export const textTrackLabels = [
  'English',
  'English CC',
  'Captions',
  'eng',
  'CC1',
];

/**
 * Static list of videojs breakpoints added to player upon resize
 */
export const videoJsBreakpoints: { [key: string]: string[] } = {
  tiny: ['tiny', 'xsmall'],
  small: ['small'],
  medium: ['medium', 'large'],
  large: ['xlarge', 'huge'],
};


// Local storage keys for muted and volume
export const LOCAL_STORAGE_MUTED_KEY = 'player.muted';
export const LOCAL_STORAGE_VOLUME_KEY = 'player.volume';

// We emit this post message in a few different places.
// This is the "command" that pbs.org is expecting to receive
// that will prompt it to navigate to another page.
export const NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO = 'navigate-to-continuous-play-video'

export const KIDS_LIVESTEAM_PROFILE = 'kids-main';

// PLYR-1007 Adding this platform name to use across GA4 events
export const PBS_PLATFORM = 'GA Web Player';

// This values aligns with Apps team guidance on GA4 event names.
// https://pbsdigital.atlassian.net/wiki/spaces/PROD/pages/167382660/GA4+GA+Apps+Guide#167392682
export const GOOGLE_FEATURE_TRACKING_EVENT_NAME = 'feature_tracking';

export const FALLBACK_LIVESTREAM_POSTER_IMAGE_URL =
  'https://image.pbs.org/curate/player/player-fallback-image.jpg';

export const MEDIA_START = 'mediastart';
export const MEDIA_STOP = 'mediastop';
