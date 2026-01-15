import * as detect from '../lib/detect';
import { VideoJsPBSPlayer } from '../player/player';
import { LivePlayerContext, Video } from '../bridge';
import { PBSPlayerLivestream } from '../live-player/videojs';

export const isSafari = detect.isSafari();

export type VideoCodec = {
  // We typically use AVC (aka h.264) for our video codec; however,
  // that will soon expand to include HEVC/HVC1 (aka h.265) and maybe AV1 or VP9.
  codec: 'AVC' | 'HEVC' | 'AV1' | 'VP9';
  profile:
    | 'Baseline'
    | 'Main'
    | 'Main 10'
    | 'Extended'
    | 'High'
    | 'High 10'
    | 'High 4:2:2'
    | 'High 4:4:4'
    | 'Unknown';
  level: string;
};

// Livestreams and VOD all use AAC-LC (stereo) at the moment.
// https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs#aac_advanced_audio_coding
export type AudioCodec = {
  codec: 'AAC';
  profile: 'LC' | 'Unknown';
};

/**
 * Parses an audio codec string and returns an object representing the audio codec details.
 *
 * @param codecString - The codec string to parse. If undefined or null, the function returns `null`.
 * @returns An object containing the audio codec details, including the codec type and profile.
 *          If the codec string contains "mp4a", the profile is set to "LC". Otherwise, the profile is "Unknown".
 *          Returns `null` if the input codec string is not provided.
 */
export function parseAudioCodecString(codecString?: string): AudioCodec | null {
  if (!codecString) return null;

  // MP4-only videos have no profile or level defined and are static
  if (codecString.includes('mp4a')) {
    return {
      codec: 'AAC',
      profile: 'LC',
    };
  } else {
    return {
      codec: 'AAC',
      profile: 'Unknown',
    };
  }
}

/**
 * Parses a video codec string and extracts codec information such as codec type,
 * profile, and level. Supports parsing for AVC (H.264) and HEVC (H.265) codec strings.
 *
 * @param videoCodecString - The codec string to parse (e.g., "avc1.64001e" or "hvc1.1.6.L120.B0").
 * @returns An object containing the codec type, profile, and level if parsing is successful,
 *          or `null` if the input string is invalid or unsupported.
 */
export const parseVideoCodecString = (
  videoCodecString?: string,
): VideoCodec | null => {
  if (!videoCodecString) return null;

  // AVC (e.g., avc1.64001e)
  const avcMatch = videoCodecString.match(/^avc1\.(\w{6})$/i);
  if (avcMatch) {
    const hex = avcMatch[1];
    const profileIdc = parseInt(hex.slice(0, 2), 16);
    const levelIdc = parseInt(hex.slice(4, 6), 16);

    const profileMap: Record<number, VideoCodec['profile']> = {
      66: 'Baseline',
      77: 'Main',
      88: 'Extended',
      100: 'High',
      110: 'High 10',
      122: 'High 4:2:2',
      144: 'High 4:4:4',
    };

    return {
      codec: 'AVC',
      profile: profileMap[profileIdc] ?? 'Unknown',
      level: (levelIdc / 10).toFixed(1),
    };
  }
  // MP4
  if (videoCodecString === 'avc1') {
    return {
      codec: 'AVC',
      profile: 'Baseline',
      level: '3.0',
    };
  }

  // HEVC (e.g., hvc1.1.6.L120.B0)
  const hevcMatch = videoCodecString.match(
    /^hvc1\.(\d+)\.(\d+)\.L(\d+)\.B\d+$/i,
  );
  if (hevcMatch) {
    const profileId = parseInt(hevcMatch[1], 10);
    const levelInt = parseInt(hevcMatch[3], 10);

    const profileMap: Record<number, VideoCodec['profile']> = {
      1: 'Main',
      2: 'Main 10',
    };

    return {
      codec: 'HEVC',
      profile: profileMap[profileId] ?? 'Unknown',
      level: (levelInt / 10).toFixed(1),
    };
  }

  return null;
};

/**
 * Extracts the first codec string from a given codec attribute string.
 *
 * The function uses a regular expression to match the `codecs` attribute
 * in the provided string and returns the first codec found.
 *
 * @param codecString - A string containing the `codecs` attribute, typically in the format `codecs="codec1,codec2"`.
 * @returns The first codec string found in the input, or `undefined` if no match is found.
 *
 */
const matchRegexCodec = (codecString: string) => {
  const regex = /codecs="([^"]+)"/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(codecString)) !== null) {
    matches.push(match[1]);
  }
  return matches[0];
};

const getHlsCodecs = (
  player: VideoJsPBSPlayer | PBSPlayerLivestream,
): {
  videoCodecString?: string;
  audioCodecString?: string;
} => {
  //@ts-ignore -- undocumented property
  const tech = player.tech(true);
  const vhs = (tech as any).vhs;

  if (vhs?.playlists?.media) {
    const media = vhs.playlists.media();
    // Follows MIME codec parameters -- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter
    // e.g. "avc1.640029,mp4a.40.2" or "hvc1.1.6.L120.B0,mp4a.40.2"
    const codecString = media?.attributes.CODECS;

    if (codecString) {
      const codecs = codecString.split(',');
      return extractCodecStrings(codecs);
    }
  }
  return { videoCodecString: undefined, audioCodecString: undefined };
};

const getDashCodecs = (
  player: VideoJsPBSPlayer | PBSPlayerLivestream,
): {
  videoCodecString?: string;
  audioCodecString?: string;
} => {
  if (player.dash && player.dash.mediaPlayer) {
    const dashMediaPlayer = player.dash.mediaPlayer;
    const videoTrack = dashMediaPlayer?.getCurrentTrackFor('video');
    const audioTrack = dashMediaPlayer?.getCurrentTrackFor('audio');
    const videoCodec = videoTrack.codec;
    const audioCodec = audioTrack.codec;

    if (videoCodec && audioCodec) {
      // e.g., video/mp4;codecs="avc1.64000D" and audio/mp4;codecs="mp4a.40.2"
      return {
        videoCodecString: matchRegexCodec(videoCodec),
        audioCodecString: matchRegexCodec(audioCodec),
      };
    }
    return {
      videoCodecString: videoCodec,
      audioCodecString: audioCodec,
    };
  } else {
    return { videoCodecString: undefined, audioCodecString: undefined };
  }
};

async function getCodecInfoFromMasterPlaylist(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');

  const codecs: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#EXT-X-STREAM-INF') && line.includes('CODECS=')) {
      const match = line.match(/CODECS="([^"]+)"/);
      if (match) codecs.push(match[1]);
    }
  }
  return codecs[0]; // ["avc1.4d401f,mp4a.40.2", ...]
}

export const getLivestreamCodecs = async (
  livePlayer: PBSPlayerLivestream,
  liveContext: LivePlayerContext,
): Promise<{ videoCodecString?: string; audioCodecString?: string }> => {
  if (liveContext.hasDrmFeed && !isSafari) {
    return getDashCodecs(livePlayer);
  } else {
    if (isSafari) {
      // Safari uses native HLS, not Media Source Extensions (MSE), so information is limited.
      const masterPlaylistUrl = livePlayer.currentSrc();
      const codecs = await getCodecInfoFromMasterPlaylist(masterPlaylistUrl);
      if (!codecs) {
        return { videoCodecString: undefined, audioCodecString: undefined };
      }
      const codecString = codecs.split(',');
      return extractCodecStrings(codecString);
    } else {
      return getHlsCodecs(livePlayer);
    }
  }
};


/**
 * Retrieves the codec strings for video and audio based on the provided player and video object.
 *
 * This function determines the appropriate codec strings depending on the video encoding types,
 * DRM status, and whether the browser is Safari. It handles different scenarios such as MP4 encodings,
 * HLS encodings, and DRM-protected content.
 *
 * @param player - The Video.js PBS player instance used to retrieve codec information.
 * @param video - The video object containing metadata about the video, including encoding types and DRM status.
 * @param isSafari - Optional. A boolean indicating whether the browser is Safari. Defaults to the result of `detect.isSafari()`.
 * @returns A promise that resolves to an object containing the video and audio codec strings.
 *          - `videoCodecString`: The codec string for the video, if available.
 *          - `audioCodecString`: The codec string for the audio, if available.
 */
export const getCodecStrings = async (
  player: VideoJsPBSPlayer,
  video: Video,
  isSafari: boolean = detect.isSafari(),
): Promise<{
  videoCodecString?: string;
  audioCodecString?: string;
}> => {
  if (video.hasMp4Encodings && !video.hasHlsEncodings) {
    // If the player is not using HLS, we can get the codecs from the video object
    // These are the most common strings found in our MP4 encodings -- can be checked in MediaConvert profiles (pbs-video account)
    return {
      videoCodecString: 'avc1',
      audioCodecString: 'mp4a',
    };
  } else {
    if (video.hasDrm && !isSafari) {
      return getDashCodecs(player);
    } else {
      if (isSafari) {
        // Safari uses native HLS, not Media Source Extensions (MSE) so information is limited.
        // We can't get the codecs from the player, so we have to use the master playlist
        const masterPlaylistUrl = player.currentSrc();
        const codecs = await getCodecInfoFromMasterPlaylist(masterPlaylistUrl);
        if (!codecs) {
          return { videoCodecString: undefined, audioCodecString: undefined };
        }
        const codecString = codecs.split(',');
        return extractCodecStrings(codecString);
      } else {
        return getHlsCodecs(player);
      }
    }
  }
};

/**
 * Extracts video and audio codec strings from an array of codec strings.
 *
 * @param codecString - An array of codec strings to search through.
 * @returns An object containing the extracted video and audio codec strings, if found.
 *          - `videoCodecString`: A string representing the video codec, if a match is found.
 *          - `audioCodecString`: A string representing the audio codec, if a match is found.
 */
function extractCodecStrings(codecString: string[]): {
  videoCodecString?: string;
  audioCodecString?: string;
} {
  return {
    videoCodecString: codecString.find(
      (c) =>
        c.includes('av') ||
        c.includes('vp') ||
        c.includes('hev') ||
        c.includes('hvc'),
    ),
    audioCodecString: codecString.find(
      (c) => c.includes('mp4') || c.includes('ac'),
    ),
  };
}
