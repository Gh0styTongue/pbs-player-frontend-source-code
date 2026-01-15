import * as Qs from 'qs';

import { Context, Video } from '../bridge';

export const getDfpStationTag = (video: Video): string => {
  const videoCallsign = (video.program && video.program.producer) || 'PBS';
  const dfpStation =
    videoCallsign.toLowerCase() === 'pbs' ? 'National' : videoCallsign;
  return `PBS_Video_${dfpStation}`;
};

export interface ImaTagOptions {
  iu: string;
  correlator: number;
  sz: string;
  ciu_szs: string;
  impl: string;
  gdfp_req: string;
  env: string;
  ad_rule: string;
  cmsid: string;
  vid: string;
  output: string;
  unviewed_position_start: string;
  player_width: string;
  player_height: string;
  cust_params: string;
}

export const getImaTagOptions = (
  context: Context,
  video: Video
): ImaTagOptions => {
  const dfpAccountId = '22540141786';
  const parentAdUnitName = 'n6735.pbs';
  const dfpStationTag = getDfpStationTag(video);

  // determine custom param values
  const pbsuser = context.userId ? 'yes' : 'no';
  const passportStatus = context.userPassportStatus ? context.userPassportStatus : 'undefined';
  const stationCallsign = context.callsign ? context.callsign.toLowerCase() : 'undefined';

  // video tag parameters are documented in:
  // https://support.google.com/dfp_premium/answer/1068325?hl=en

  return {
    // current ad unit. follows the format: /network_id/.../ad_unit
    iu: `/${dfpAccountId}/${parentAdUnitName}/${dfpStationTag}`,

    // a random positive number, typically the timestamp of the page
    // view, that's shared by multiple requests coming from the same page view.
    correlator: new Date().getTime(),

    // size of master video ad slot. Multiple sizes should
    // be separated by the pipe (|) character.
    // this is just a placeholder size dictated by pbs ads team that's always constant.
    sz: '400x300',

    // comma-separated list of companion sizes.
    // this is a hard-coded companion ad size on that only applies to portalplayer.
    ciu_szs: '728x90',

    // implementation.
    impl: 's',

    // indicates that the user is on the DFP schema and
    // is not a legacy Google Ad Manager publisher.
    gdfp_req: '1',

    // indicates that the request is from a video player.
    env: 'vp',

    // indicates whether to return a creative or an ad rules response.
    ad_rule: '1',

    // in order to target ads to video content, your master video tag
    // needs to include both cmsid and vid. the cmsid is a unique number
    // for each content source. to find it, on the Video tab in DFP, click
    // Content sources and then the name of the content source. the vid is
    // a string or number identifying a particular piece of video content.
    // in our case, it's the legacy tp media id.
    cmsid: '2588203',
    vid: video.id,

    // output format of ad.
    output: 'xml_vmap1',

    // setting this to 1 turns on delayed impressions for video.
    unviewed_position_start: '1',

    // dimensions of the video player.
    player_width: '1706',
    player_height: '960',

    // extra Key-value parameters.
    cust_params: `pbsuser=${pbsuser}&passport=${passportStatus}&station=${stationCallsign}`,
  };
};

/**
 * Get custom video google IMA dfp tag
 */
export function getImaTag(context: Context, video: Video): string {
  const base = 'https://pubads.g.doubleclick.net/gampad/ads';
  const params = Qs.stringify(getImaTagOptions(context, video));
  return base + '?' + params;
}
