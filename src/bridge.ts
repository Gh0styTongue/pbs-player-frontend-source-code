import * as Qs from 'qs';
import parseInt from 'lodash-es/parseInt';
import mapValues from 'lodash-es/mapValues';

type PlayerType =
  | 'portal_player'
  | 'station_player'
  | 'partner_player'
  | 'viral_player'
  | 'bento_player';

export type VideoType = 'full_length' | 'clip' | 'preview';

export type LivePlayerType =
  | 'ga_livestream_portal_player'
  | 'ga_livestream_partner_player'
  | 'ga_livestream_station_player';

export type PlayerFramework = 'Video.js';

interface CaptionsBridge {
  DFXP?: string;
  WebVTT?: string;
  'Caption-SAMI'?: string;
}

export interface MultipleLanguageCaptionsBridge {
  profile: 'WebVTT' | 'DFXP' | 'SRT' | 'Caption-SAMI';
  url: string;
  language: string;
  primary: boolean;
}

interface ChapterBridge {
  duration: number;
  image?: string;
  start_time: number;
  title: string;
}

interface ProgramBridge {
  producer?: string;
  slug: string;
  title: string;
}

interface ViewingHistoryBridge {
  legacy_tp_media_id: string;
  duration?: number;
  seconds_watched?: number;
}

interface HlsDrmVideo {
  url: string;
  profile: string;
  fairplay_license: string;
  fairplay_certificate: string;
}

interface DashDrmVideo {
  url: string;
  profile: string;
  widevine_license: string;
  playready_license: string;
}

export interface RelatedVideoBridge {
  id: number;
  images: {
    mezzanine: string;
  };
  program: {
    title: string;
    slug: string;
  };
  title: string;
  slug: string;
}

export interface RelatedAccessibleVideoBridge {
  accessibility_profile: string;
  id: number;
  images: {
    'asset-mezzanine-16x9': string;
  };
  program: {
    title: string;
    slug: string;
  };
  slug: string;
  title: string;
  hls_videos: {
    url: string;
    profile: string;
  }[]

}

export interface VideoBridge {
  air_date?: string;
  air_date_formatted?: string;
  allow_embed: boolean;
  can_play_preroll: boolean;
  cc: CaptionsBridge;
  cc_multiple_languages: MultipleLanguageCaptionsBridge[];
  chapters?: ChapterBridge[];
  cid: string;
  closed_caption_url: string;
  dash_drm_video?: DashDrmVideo;
  donation_url?: string;
  duration: number;
  dvd_link?: string;
  encodings: string[];
  expire_date?: string;
  GA_events_codes: string[];
  GA_national_codes: string[];
  has_drm: boolean;
  has_hls_encodings: boolean;
  has_mp4_encodings: boolean;
  hls_drm_video?: HlsDrmVideo;
  id: string;
  image_url: string;
  is_mvod: boolean;
  is_playable: boolean;
  itunes_link?: string;
  long_description?: string;
  member_stations?: string[];
  passport_learn_more_url?: string;
  passport_url?: string;
  program?: ProgramBridge;
  rating?: string;
  related_videos?: RelatedVideoBridge[];
  related_accessibility_videos?: RelatedAccessibleVideoBridge[];
  series_info?: string;
  short_common_name?: string;
  short_description?: string;
  slug: string;
  station_color_logo?: string;
  title: string;
  trick_play_file: string;
  video_type: VideoType;
}

interface Chapter {
  start: number;
  title: string;
}

export interface Video {
  airDate?: string;
  airDateFormatted?: string;
  allowEmbed: boolean;
  canPlayPreroll: boolean;
  cc: CaptionsBridge;
  cc_multiple_languages?: MultipleLanguageCaptionsBridge[];
  chapters: Chapter[];
  cid: string;
  closedCaptionUrl?: string;
  dashDrmVideo?: DashDrmVideo;
  donationUrl?: string;
  duration: number;
  dvdLink?: string;
  encodings: string[];
  eventIds: string[];
  eventNationalIds: string[];
  expireDate?: string;
  hasDrm: boolean;
  hasHlsEncodings: boolean;
  hasMp4Encodings: boolean;
  hlsDrmVideo?: HlsDrmVideo;
  id: string;
  imageUrl: string;
  isMvod: boolean;
  isPlayable: boolean;
  itunesLink?: string;
  longDescription?: string;
  memberStations: string[];
  passportLearnMoreUrl?: string;
  passportUrl?: string;
  program?: ProgramBridge;
  rating?: string;
  relatedVideos?: RelatedVideoBridge[];
  relatedAccessibilityVideos?: RelatedAccessibleVideoBridge[];
  seriesInfo?: string;
  shortCommonName?: string;
  shortDescription?: string;
  slug: string;
  stationColorLogo?: string;
  title: string;
  trickPlayFileUrl?: string;
  videoType: VideoType;
}

export interface ViewingHistory {
  legacyTpMediaId: string;
  duration?: number;
  secondsWatched?: number;
}

export interface PlayerDimensions {
  width?: number;
  height?: number;
}

export interface PlayerStartEndOptions {
  start?: number;
  end?: number;
  chapter?: number;
}

export interface Features {
  pbs_internal_disable_geolocation_livestreams: boolean;
}

export interface ContextBridge {
  player_type: PlayerType;
  player_framework: PlayerFramework;
  player_framework_version: string;
  player_version: string;
  callsign?: string;
  user_id?: string;
  user_passport_status?: string;
  station_id: string;
  viewing_history: { [key: number]: ViewingHistoryBridge };
  features: Features;
  // used by Google Analytics 4
  ga4_measurement_id: string;
  ga4_player_name: string;
}

export interface LivePlayerContextBridge {
  player_type: LivePlayerType;
  player_framework: PlayerFramework;
  player_framework_version: string;
  player_version: string;
  features: Features;
  ga_live_stream_feed_cid: string;
  ga_live_stream_url: string;
  feed_name: string;
  event_station_id: string;
  event_national_id: string;
  // the field to indicate whether to display the station logo
  logo_overlay: boolean;
  schedule_url: string;
  station_logo: string;
  station_common_name: string;
  station_id: string;
  station_callsign: string;
  image_url: string;
  has_drm_feed?: boolean;
  drm_feed_cid?: string;
  drm_hls_url?: string;
  non_drm_url?: string;
  drm_dash_url?: string;
  drm_fairplay_license_url?: string;
  drm_widevine_license_url?: string;
  drm_playready_license_url?: string;
  // used by Google Analytics 4
  ga4_measurement_id: string;
  ga4_player_name: string;
}

export enum LivestreamAvailability {
  idle = 'idle',
  evaluating = 'evaluating',
  success = 'success',
  rejected = 'rejected',
  locationDenied = 'locationDenied',
  locationTimedOut = 'locationTimedOut',
  locationNeeded = 'locationNeeded',
}

export interface PlayerOptions {
  topbar: boolean;
  autoplay: boolean;
  muted: boolean;
  endscreen: boolean;
  parentUrl?: string;
  start?: number;
  end?: number;
  chapter?: number;
  width?: number;
  height?: number;
  previewLayout?: boolean;
  unsafeDisableUpsellHref: boolean;
  unsafeDisableSponsorship: boolean;
  unsafeDisableContinuousPlay: boolean;
}

export interface LivePlayerOptions {
  autoplay: boolean;
  muted: boolean;
  feedCid?: string | null;
  channelSwitch?: boolean;
  scheduleLink?: boolean;
  channelToggle?: boolean;
  unsafePBSInternalDisableGeolocationLivestreams?: boolean;
}

export interface Context {
  options: PlayerOptions;
  playerType: PlayerType;
  playerFramework: PlayerFramework;
  playerFrameworkVersion: string;
  playerVersion: string;
  callsign?: string;
  userId?: string;
  userPassportStatus?: string;
  stationId: string;
  viewingHistory: { [key: number]: ViewingHistory };
  features: Features;
  ga4MeasurementId: string;
  ga4PlayerName: string;
}

export interface LivePlayerContext {
  playerType: LivePlayerType;
  playerFramework: PlayerFramework;
  playerFrameworkVersion: string;
  playerVersion: string;
  features: Features;
  gaLiveStreamFeedCid: string;
  gaLiveStreamUrl: string;
  gaLiveStreamFeedName: string;
  eventStationId: string;
  eventNationalId: string;
  displayLogoOverlay: boolean;
  scheduleUrl: string;
  stationLogo: string;
  stationCommonName: string;
  stationId: string;
  stationCallsign: string;
  imageUrl?: string;
  options: LivePlayerOptions;
  hasDrmFeed?: boolean;
  drmFeedCid?: string;
  drmHlsUrl?: string | null;
  nonDrmUrl?: string | null;
  drmDashUrl?: string | null;
  drmFairplayLicenseUrl?: string | null;
  drmWidevineLicenseUrl?: string | null;
  drmPlayreadyLicenseUrl?: string | null;
  ga4MeasurementId: string;
  ga4PlayerName: string;
}

/**
 * Parse the video data passed via django view context/template.
 * @param videoBridge - video data passed from django view.
 */
export function videoBridgeToVideo(videoBridge: VideoBridge): Video {
  return {
    airDate: videoBridge.air_date,
    airDateFormatted: videoBridge.air_date_formatted,
    allowEmbed: videoBridge.allow_embed,
    canPlayPreroll: videoBridge.can_play_preroll,
    cc: videoBridge.cc,
    cc_multiple_languages: videoBridge.cc_multiple_languages,
    chapters: (videoBridge.chapters || []).map((c) => ({
      start: c.start_time,
      title: c.title,
    })),
    cid: videoBridge.cid,
    closedCaptionUrl: videoBridge.closed_caption_url,
    dashDrmVideo: videoBridge.dash_drm_video,
    donationUrl: videoBridge.donation_url,
    duration: videoBridge.duration,
    dvdLink: videoBridge.dvd_link,
    encodings: videoBridge.encodings,
    eventIds: videoBridge.GA_events_codes,
    eventNationalIds: videoBridge.GA_national_codes,
    expireDate: videoBridge.expire_date,
    hasHlsEncodings: videoBridge.has_hls_encodings,
    hasMp4Encodings: videoBridge.has_mp4_encodings,
    hasDrm: videoBridge.has_drm,
    hlsDrmVideo: videoBridge.hls_drm_video,
    id: videoBridge.id,
    imageUrl: videoBridge.image_url,
    isMvod: videoBridge.is_mvod,
    isPlayable: videoBridge.is_playable,
    itunesLink: videoBridge.itunes_link,
    longDescription: videoBridge.long_description,
    memberStations: videoBridge.member_stations || [],
    passportLearnMoreUrl: videoBridge.passport_learn_more_url,
    passportUrl: videoBridge.passport_url,
    program: videoBridge.program,
    rating: videoBridge.rating,
    relatedVideos: videoBridge.related_videos,
    relatedAccessibilityVideos: videoBridge.related_accessibility_videos,
    seriesInfo: videoBridge.series_info,
    shortCommonName: videoBridge.short_common_name,
    shortDescription: videoBridge.short_description,
    slug: videoBridge.slug,
    stationColorLogo: videoBridge.station_color_logo,
    title: videoBridge.title,
    trickPlayFileUrl: videoBridge.trick_play_file,
    videoType: videoBridge.video_type,
  };
}

export function isStringTruthy(str: string, defaultValue: boolean): boolean {
  if (!str) {
    return defaultValue;
  }

  return str === 'true';
}

export function getStartEndOptions(
  queryParams: any //eslint-disable-line
): PlayerStartEndOptions {
  const parsedStart = queryParams.start
    ? parseInt(queryParams.start)
    : undefined;
  const parsedEnd = queryParams.end ? parseInt(queryParams.end) : undefined;
  const parsedChapter = queryParams.chapter
    ? parseInt(queryParams.chapter)
    : undefined;

  let start: number | undefined = undefined;
  let end: number | undefined = undefined;
  let chapter: number | undefined = undefined;

  if (parsedChapter) {
    chapter = parsedChapter;
    return { start, end, chapter };
  }

  if (Number(parsedStart) > 0) {
    start = Number(parsedStart);
  }

  if (
    Number(parsedEnd) > 0 &&
    ((start && Number(parsedEnd) > start) || !parsedStart)
  ) {
    end = Number(parsedEnd);
  }

  return { start, end, chapter };
}

export function getDimensionOptions(
  queryParams: any, //eslint-disable-line
  window_ = window
): PlayerDimensions {
  const aspectRatio = 16 / 9;
  const height = queryParams.h && parseInt(queryParams.h);

  const hasInvalidHeight = !height || !(height > 0);
  if (hasInvalidHeight) {
    return { width: undefined, height: undefined };
  }

  const width = Math.ceil(aspectRatio * height);
  const hasInvalidWidth = width > window_.innerWidth;
  if (hasInvalidWidth) {
    return { width: undefined, height: undefined };
  }

  return { width, height };
}

export function parseOptions(query = document.location.search): PlayerOptions {
  const queryParams: any = Qs.parse(query.replace('?', '')); //eslint-disable-line
  const { width, height } = getDimensionOptions(queryParams);
  const { start, end, chapter } = getStartEndOptions(queryParams);
  return {
    topbar: isStringTruthy(queryParams.topbar, false),
    autoplay: isStringTruthy(queryParams.autoplay, false),
    muted: isStringTruthy(queryParams.muted, false),
    endscreen: isStringTruthy(queryParams.endscreen, true),
    previewLayout: isStringTruthy(queryParams.previewLayout, false),
    unsafeDisableUpsellHref: isStringTruthy(
      queryParams.unsafeDisableUpsellHref,
      false
    ),
    unsafeDisableSponsorship: isStringTruthy(queryParams.unsafeDisableSponsorship, false),
    unsafeDisableContinuousPlay: isStringTruthy(
      queryParams.unsafeDisableContinuousPlay,
      false
    ),
    parentUrl: queryParams.parentURL,
    start,
    end,
    chapter,
    width,
    height,
  };
}

export function parseLivePlayerOptions(
  query = document.location.search
): LivePlayerOptions {
  const queryParams: any = Qs.parse(query.replace('?', '')); //eslint-disable-line
  return {
    autoplay: isStringTruthy(queryParams.autoplay, false),
    muted: isStringTruthy(queryParams.muted, false),
    feedCid: queryParams.feed_cid || null,
    channelSwitch: isStringTruthy(queryParams.channel_switch, false),
    scheduleLink: isStringTruthy(queryParams.schedule_link, true),
    channelToggle: isStringTruthy(queryParams.channel_toggle, true),
    unsafePBSInternalDisableGeolocationLivestreams: isStringTruthy(
      queryParams.unsafePBSInternalDisableGeolocationLivestreams,
      false
    ),
  };
}

export function parseViewingHistory(
  viewingHistoryBridge: ViewingHistoryBridge
): ViewingHistory {
  return {
    legacyTpMediaId: viewingHistoryBridge.legacy_tp_media_id,
    duration: viewingHistoryBridge.duration,
    secondsWatched: viewingHistoryBridge.seconds_watched,
  };
}

/**
 * Parse the context data passed via django view context/template
 * @param contextBridge - context data passed from django view.
 */
export function contextBridgeToContext(
  contextBridge: ContextBridge,
  query = document.location.search
): Context {
  return {
    options: parseOptions(query),
    playerType: contextBridge.player_type,
    playerFramework: contextBridge.player_framework,
    playerFrameworkVersion: contextBridge.player_framework_version,
    playerVersion: contextBridge.player_version,
    callsign: contextBridge.callsign,
    userId: contextBridge.user_id,
    userPassportStatus: contextBridge.user_passport_status,
    stationId: contextBridge.station_id,
    viewingHistory: mapValues(
      contextBridge.viewing_history,
      parseViewingHistory,
    ),
    features: contextBridge.features,
    ga4MeasurementId: contextBridge.ga4_measurement_id,
    ga4PlayerName: contextBridge.ga4_player_name,
  };
}

/**
 * Parse the live player context data passed via django view context/template
 * @param livePlayerContextBridge - context data passed from django view.
 */
export function livePlayerContextBridgeToLivePlayerContext(
  livePlayerContextBridge: LivePlayerContextBridge,
  query = document.location.search
): LivePlayerContext {
  return {
    playerType: livePlayerContextBridge.player_type,
    playerFramework: livePlayerContextBridge.player_framework,
    playerFrameworkVersion: livePlayerContextBridge.player_framework_version,
    playerVersion: livePlayerContextBridge.player_version,
    options: parseLivePlayerOptions(query),
    features: livePlayerContextBridge.features,
    gaLiveStreamFeedCid: livePlayerContextBridge.ga_live_stream_feed_cid,
    gaLiveStreamUrl: livePlayerContextBridge.ga_live_stream_url,
    gaLiveStreamFeedName: livePlayerContextBridge.feed_name,
    eventStationId: livePlayerContextBridge.event_station_id,
    eventNationalId: livePlayerContextBridge.event_national_id,
    displayLogoOverlay: livePlayerContextBridge.logo_overlay,
    scheduleUrl: livePlayerContextBridge.schedule_url,
    stationLogo: livePlayerContextBridge.station_logo,
    stationCommonName: livePlayerContextBridge.station_common_name,
    stationId: livePlayerContextBridge.station_id,
    stationCallsign: livePlayerContextBridge.station_callsign,
    imageUrl: livePlayerContextBridge.image_url,
    hasDrmFeed: livePlayerContextBridge.has_drm_feed,
    drmFeedCid: livePlayerContextBridge.drm_feed_cid,
    drmHlsUrl: livePlayerContextBridge.drm_hls_url,
    nonDrmUrl: livePlayerContextBridge.non_drm_url,
    drmDashUrl: livePlayerContextBridge.drm_dash_url,
    drmFairplayLicenseUrl: livePlayerContextBridge.drm_fairplay_license_url,
    drmWidevineLicenseUrl: livePlayerContextBridge.drm_widevine_license_url,
    drmPlayreadyLicenseUrl: livePlayerContextBridge.drm_playready_license_url,
    ga4MeasurementId: livePlayerContextBridge.ga4_measurement_id,
    ga4PlayerName: livePlayerContextBridge.ga4_player_name,
  };
}
