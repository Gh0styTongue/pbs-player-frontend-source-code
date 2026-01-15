import { VideoJsPlayer } from 'video.js';
import { Context, LivePlayerContext, Video } from '../bridge';
import env from '../environment';
import {
  parseVideoCodecString,
  parseAudioCodecString,
  VideoCodec,
  getLivestreamCodecs,
  getCodecStrings,
  AudioCodec,
} from '../video/get-video-audio-metadata';
import { getDrmInfo } from '../video/get-drm-keysystem-metadata';
import { VideoJsPBSPlayer } from '../player/player';
import { PBSPlayerLivestream } from '../live-player/videojs';
import { PBS_PLATFORM } from '../constants';

// Mux SDK fields: https://www.mux.com/docs/guides/make-your-data-actionable-with-metadata
interface MuxOptionData {
  env_key: string;
  page_type?: 'watchpage' | 'iframe';
  viewer_user_id?: string;
  experiment_name?: string;
  sub_property_id?: string;

  // mux team verified these fields are slightly different from the ones in the docs
  view_client_application_name?: string;
  view_client_application_version?: string;
  video_audio_codec?: string;

  // player metadata
  player_name?: string;
  player_version?: string; // uses latest git tag/gh release number
  player_software_name?: string;
  player_software_version?: string;

  // video metadata
  video_id?: string;
  video_title?: string;
  video_series?: string;
  video_producer?: string;
  video_affiliate?: string;
  video_content_type?:
    | 'short'
    | 'movie'
    | 'episode'
    | 'clip'
    | 'trailer'
    | 'event';
  video_language_code?: string;
  video_variant_name?: string;
  video_variant_id?: string;
  video_duration?: number;
  video_stream_type?: 'live' | 'on-demand';
  video_codec?: string;
  video_encoding_variant?: string;

  // view metadata
  view_drm_type?: string;
  view_cdn_origin?: string;
}

export interface MuxOptions {
  debug: boolean;
  beaconCollectionDomain: string;
  data: MuxOptionData;
}

export async function getMuxOptions(
  context: Context,
  video: Video,
  player: VideoJsPBSPlayer,
): Promise<MuxOptions> {
  // For Mux, we don't need to know MVOD status in the client app name
  const clientApplicationName = context.ga4PlayerName.replace(
    ' MVOD',
    '',
  );

  const { videoCodecString, audioCodecString } = await getCodecStrings(
    player,
    video,
  );
  const parsedVideoCodec: VideoCodec | null =
    parseVideoCodecString(videoCodecString);
  const parsedAudioCodec: AudioCodec | null =
    parseAudioCodecString(audioCodecString);

  const videoEncodingVariant = parsedVideoCodec
    ? `${parsedVideoCodec['profile']}, ${parsedVideoCodec['level']}`
    : undefined;

  const viewDrmType = video.hasDrm ? getDrmInfo() : 'none';

  return {
    debug: false,
    beaconCollectionDomain: env.MUX_CUSTOM_DOMAIN,
    data: {
      env_key: env.MUX_ENV_KEY,
      page_type: 'iframe',
      player_name: PBS_PLATFORM,
      player_version: context.playerVersion,
      view_client_application_name: clientApplicationName,
      view_client_application_version: context.playerVersion,
      player_software_name: context.playerFramework,
      player_software_version: context.playerFrameworkVersion,
      video_id: video.slug,
      video_title: `${video.program?.title} | ${video.title} | ${video.id} | ${video.videoType}`,
      video_series: video.program?.slug,
      video_duration: video.duration,
      video_stream_type: 'on-demand',
      video_affiliate: context.callsign
        ? context.callsign.toUpperCase()
        : undefined,
      view_drm_type: viewDrmType,
      video_codec: parsedVideoCodec ? parsedVideoCodec['codec'] : undefined,
      video_encoding_variant: videoEncodingVariant,
      video_audio_codec: parsedAudioCodec
        ? parsedAudioCodec['codec']
        : undefined,
    },
  };
}

export async function getMuxLivePlayerOptions(
  livePlayer: VideoJsPlayer,
  context: LivePlayerContext,
): Promise<MuxOptions> {
  const clientApplicationName = context.ga4PlayerName;
  const { videoCodecString, audioCodecString } = await getLivestreamCodecs(
    livePlayer,
    context,
  );
  const parsedVideoCodec: VideoCodec | null =
    parseVideoCodecString(videoCodecString);
  const parsedAudioCodec: AudioCodec | null =
    parseAudioCodecString(audioCodecString);

  // station primary livestreams ('ga-main') are DRM protected -- HLS or DASH, depends on browser
  // national and local station subchannels are not DRM protected -- HLS only;
  const viewDrmType = context.hasDrmFeed ? getDrmInfo() : 'none';

  return {
    debug: false,
    beaconCollectionDomain: env.MUX_CUSTOM_DOMAIN,
    data: {
      env_key: env.MUX_ENV_KEY,
      page_type: 'iframe',
      player_name: PBS_PLATFORM,
      player_version: context.playerVersion,
      view_client_application_name: clientApplicationName,
      view_client_application_version: context.playerVersion,
      player_software_name: context.playerFramework,
      player_software_version: context.playerFrameworkVersion,
      video_id: context.gaLiveStreamFeedCid,
      video_title: `${context.stationCallsign} Livestream ${context.gaLiveStreamFeedName}`,
      video_stream_type: 'live',
      video_affiliate: context.stationCallsign,
      video_codec: parsedVideoCodec ? parsedVideoCodec['codec'] : undefined,
      video_encoding_variant: parsedVideoCodec
        ? `${parsedVideoCodec['profile']}, ${parsedVideoCodec['level']}`
        : undefined,
      video_audio_codec: parsedAudioCodec
        ? parsedAudioCodec['codec']
        : undefined,
      view_drm_type: viewDrmType,
    },
  };
}

export function initVideoJSMuxAnalytics(
  player: VideoJsPBSPlayer,
  options: MuxOptions,
): void {
  // if mux isn't loaded for some reason, like if it's blocked
  if (typeof player.mux === 'undefined') {
    return;
  }
  player.mux(options);
}

export function initVideoJSMuxLivePlayerAnalytics(
  player: PBSPlayerLivestream,
  options: MuxOptions,
): void {
  // if mux isn't loaded for some reason, like if it's blocked
  if (typeof player.mux === 'undefined') {
    return;
  }
  player.mux(options);
}
