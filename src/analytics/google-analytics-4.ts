import { Context, LivePlayerContext, Video, VideoType } from '../bridge';
import { GOOGLE_FEATURE_TRACKING_EVENT_NAME, PBS_PLATFORM, MEDIA_START, MEDIA_STOP } from '../constants';

type EventAction = typeof MEDIA_START | typeof MEDIA_STOP;

interface GoogleAnalytics4EventFields {
  pbs_platform: typeof PBS_PLATFORM;
  video_player: string;
  show_title?: string;
  video_title?: string;
  video_tp_media_id?: string;
  video_type?: VideoType;
  video_streaming_duration?: number;
  // if user is signed in
  signed_in_status: boolean;
  // PLYR-930 adding these new fields for livestreams
  pbs_livestream_channel_content_id?: string;
  livestream_channel_name?: string;
}

interface GoogleAnalytics4UserFields {
  // user's localized-station callsign letters
  station_localization?: string;
  // station callsign that user is Passport member of
  passport_station?: string;
}

interface TrackEventValues {
  value?: number;
}

interface FeatureTrackingParameters {
    // ID in Profile Service; should always match 'signed_in_user'. e.g. "516f21b9-40a4-4251-9fb8-b87756b77ce2"
    user_id?: string | null;
    // ID in Profile Service. Should agree with user_id. e.g. "516f21b9-40a4-4251-9fb8-b87756b77ce2"
    signed_in_user?: string | null;
    // Call letters of the station(s) the user is a member of. e.g. "WETA,WHUT"
    passport_station?: string | null;
    // Authentication status of the user at the time of interaction. e.g. true or false
    signed_in_status?: boolean | null;
    // Our shared platform name across events
    pbs_platform?: typeof PBS_PLATFORM;
    // Show title associated with the item that was selected. e.g. "Sanditon"
    show_title?: string | null;
    // Slug for the item that was selected. e.g. "episode-2-dsuf6f"
    pbs_content_id?: string | null;
    // Title of the video that was selected. e.g. "Episode 2"
    video_title?: string | null;
    // TP Media ID for the video that was selected. e.g. "32958623"
    video_tp_media_id?: string | null;
    // Type of video that was selected. e.g. "episode", "clip", "special"
    // See VideoTypeEnum for more details.
    video_type?: VideoType | null;
    // e.g. GA National Player, GA Local Player, GA Partner Player, etc.
    video_player?: string | null;
    // Feed CID for the live channel that was selected.
    pbs_livestream_channel_content_id?: string | null;
    // Full name of the live channel that was selected.
    livestream_channel_name?: string | null;
    // Franchise title associated with the item that was selected. e.g. "Masterpiece"
    franchise_title?: string | null;
    // Name of the item that was selected. e.g. "up next - play"
    object_name?: string | null;
    // Type of item that was selected. e.g. "button", "link"
    object_type?: string | null;
    // Ordinal position of the item within the module. e.g. 1, 2, 3
    object_position?: number | null;
    // Location of the item on the screen. e.g. "up next - modal"
    object_location?: string | null;
    // Text or call to action of the item as it's displayed to the user. e.g. "Watch Now"
    object_text?: string | null;
    // Action taken by the user when they selected the item. e.g. "click"
    object_action?: string | null;
    // Behavior/result of the action taken by the user when they selected the item.
    // e.g. "navigate to passport learn more"
    object_action_behavior?: string | null;
    // The URL if the item selected. e.g. "https://watch.weta.org/passport/learn-more"
    object_url?: string | null;
    // Query that the user entered as part of this action. e.g. "123456"
    field_entry_value?: string | null;
    // Name of the feature associated with the item that was selected. e.g. "up next - passport promo"
    feature_name?: string | null;
    // Category of the feature associated with the item that was selected. e.g. "continuous play"
    feature_category?: string | null;

}

const setGoogleAnalyticsUserProperties = (
  localized_station?: string,
  passport_station?: string,
) => {
  if (localized_station || passport_station) {
    const userProperties: GoogleAnalytics4UserFields = {};

    if (localized_station) {
      userProperties.station_localization = localized_station;
    }

    if (passport_station) {
      userProperties.passport_station = passport_station;
    }
    gtag('set', 'user_properties', userProperties);
  }
};

export function trackEvent(
  eventAction: EventAction,
  context: Context,
  video: Video,
  trackEventValues: TrackEventValues = {},
): void {
  // PLYR-958 - user properties are captured on the first event fired on a page.
  // In our case, this will almost always be a mediastart.
  // However, we need to set the user properties *first*, then fire the event.
  // If you are inspecting events with the GA Debug extension, you will see these properties
  // reflected in the mediastart, but *not* on mediastop. This is because user properties are
  // captured only once, per
  // https://support.google.com/analytics/answer/12370404?sjid=17419083079386628691-NA#zippy=%2Cgoogle-tag-websites
  setGoogleAnalyticsUserProperties(context.callsign, video.memberStations[0]);

  const eventValues: GoogleAnalytics4EventFields = {
    video_player: context.ga4PlayerName,
    video_title: video.title,
    video_tp_media_id: video.id,
    video_type: video.videoType,
    signed_in_status: context.userId ? true : false,
    pbs_platform: PBS_PLATFORM,
  };

  if (video.program?.title) {
    eventValues.show_title = video.program.title;
  }

  // Only report duration watched on MediaStop events
  if (eventAction === MEDIA_STOP) {
    eventValues.video_streaming_duration = trackEventValues.value;
  }

  gtag('event', eventAction, eventValues);
}

export function trackLiveEvent(
  eventAction: EventAction,
  livePlayerContext: LivePlayerContext,
  trackEventValues: TrackEventValues = {},
): void {
  // Callsign is used for both user scoped custom dimensions
  const callsign = livePlayerContext.stationCallsign;
  // See the lengthy comment in trackEvent() for why we set user properties first
  setGoogleAnalyticsUserProperties(callsign, callsign);

  const eventValues: GoogleAnalytics4EventFields = {
    pbs_platform: PBS_PLATFORM,
    video_player: livePlayerContext.ga4PlayerName,
    // TODO when we can detect the show currently playing on the livestream,
    // use that show title instead of generic string 'Livestream'
    video_title: 'Livestream',
    signed_in_status: false,
  };

  if (livePlayerContext.gaLiveStreamFeedCid) {
    eventValues.pbs_livestream_channel_content_id =
      livePlayerContext.gaLiveStreamFeedCid;
  }

  if (livePlayerContext.gaLiveStreamFeedName) {
    eventValues.livestream_channel_name =
      livePlayerContext.gaLiveStreamFeedName;
  }

  // Only report duration watched on MediaStop events
  if (eventAction === MEDIA_STOP) {
    eventValues.video_streaming_duration = trackEventValues.value;
  }

  gtag('event', eventAction, eventValues);
}

/**
 * Sends feature_tracking events to Google Analytics 4
 * Context and Video objects are optional, but help determine the player type.
 * @param {FeatureTrackingParameters} parameters - parameters to send to GA4
 * @param {Context} context - context object
 * @param {Video} video - video object
 * @returns {void}
*/
export const featureTrackingEvent = (
  parameters: FeatureTrackingParameters,
  context?: Context,
) => {
  const passedParameters: FeatureTrackingParameters = {
    ...parameters,
    pbs_platform: PBS_PLATFORM,
    video_player: context?.ga4PlayerName,
  };
  // send a gtag event with the special event name
  gtag('event', GOOGLE_FEATURE_TRACKING_EVENT_NAME, passedParameters);
};
