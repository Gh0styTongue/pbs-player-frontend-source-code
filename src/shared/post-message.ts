import { VideoJsPlayer } from 'video.js';
import { filterTextTrackList } from '../captions/filter-text-track-list';
import { safePlay } from './safe-play';

export type DispatchMessageType =
  | 'videojs:play'
  | 'videojs:pause'
  | 'videojs:finished'
  | 'videojs:userIsHoveringOverVideo'
  | 'videojs:userNotHoveringOverVideo'
  | 'videojs:portalPreviewVideoIsPlayingWebKit'
  | 'videojs:closedCaptionsSettingsOpen'
  | 'videojs:closedCaptionsSettingsClosed'
  | 'videojs:playerReady'
  | 'partnerPlayer:furthestPosition';

function commandToggle(player: VideoJsPlayer) {
  if (!player.paused()) {
    player.pause();
  } else {
    safePlay(player);
  }
}

function commandPlay(player: VideoJsPlayer) {
  safePlay(player);
}

function commandPause(player: VideoJsPlayer) {
  player.pause();
}

function commandSkipForward(player: VideoJsPlayer) {
  player.currentTime(player.currentTime() + 10);
}

function commandSkipBackward(player: VideoJsPlayer) {
  player.currentTime(player.currentTime() - 10);
}

function commandMute(player: VideoJsPlayer) {
  const isMuted = player.muted();
  player.muted(!isMuted);
}

function commandToggleFullscreen(player: VideoJsPlayer) {
  const isFullscreen = player.isFullscreen();
  if (isFullscreen) {
    player.exitFullscreen();
  } else {
    try {
      player.requestFullscreen();
    } catch (error) {
      // Handle synchronous errors like "Permissions check failed" - expected behavior
    }
  }
}

function commandClosedCaptions(player: VideoJsPlayer) {
  const tracks = player.textTracks();
  if (!tracks || tracks.length === 0) return;

  const subtitlesAndCaptions = filterTextTrackList(tracks);

  if (subtitlesAndCaptions.length > 0) {
    const firstTrack = subtitlesAndCaptions[0]
    firstTrack.mode = firstTrack.mode === 'showing' ? 'disabled' : 'showing';
    return;
  }
}

function commandVolumeUp(player: VideoJsPlayer) {
  const currentVolume = player.volume();
  player.volume(Math.min(currentVolume + 0.1, 1));
}

function commandVolumeDown(player: VideoJsPlayer) {
  const currentVolume = player.volume();
  player.volume(Math.max(currentVolume - 0.1, 0));
}

/**
 * When Player is embedded as an iframe, it can't know its parent's viewport dimensions.
 * We send post messages from the Portals (PBS.org/SVPs) in order to dynamically shift the controls up (above a Sponsorship row) or leave them at their default bottom-right position.
 */

function commandControlsUp(player: VideoJsPlayer) {
  if (player) {
    const controlBar = player.getChild('controlBar');
    controlBar && controlBar.addClass('shift-controls-up');
  }
}
function commandControlsDefault(player: VideoJsPlayer) {
  if (player) {
    const controlBar = player.getChild('controlBar');
    controlBar && controlBar.removeClass('shift-controls-up');
  }
}

const commandHandlers = {
  toggle: commandToggle,
  play: commandPlay,
  pause: commandPause,
  controlsUp: commandControlsUp,
  controlsDefault: commandControlsDefault,
  skipForward: commandSkipForward,
  skipBackward: commandSkipBackward,
  mute: commandMute,
  toggleFullscreen: commandToggleFullscreen,
  closedCaptions: commandClosedCaptions,
  volumeUp: commandVolumeUp,
  volumeDown: commandVolumeDown
};

export function handlePostMessage(
  player: VideoJsPlayer,
  data: { command: string },
): void {
  const command = data && data.command;
  const handler = commandHandlers[command];
  if (handler) {
    handler(player);
  }
}

function sendPostMessage(message: { event: DispatchMessageType; [key: string]: any }) {
  if (!document.referrer) {
    // Don't send postMessage if it's not in an iframe
    return;
  }
  parent.postMessage(JSON.stringify(message), document.referrer);
}

export function dispatchPostMessages(player: VideoJsPlayer): void {
  player.on('play', () => {
    sendPostMessage({ event: 'videojs:play' });
  });

  player.on('pause', () => {
    sendPostMessage({ event: 'videojs:pause' });
  });

  player.on('ended', () => {
    sendPostMessage({ event: 'videojs:finished' });
  });

  // Sent to portals to synchronize the fading in/out of the player controls with
  // surrounding parent portal visual elements (info overlays, etc.)
  player.on('userIsHoveringOverVideo', () => {
    sendPostMessage({ event: 'videojs:userIsHoveringOverVideo' });
  });
  player.on('userNotHoveringOverVideo', () => {
    sendPostMessage({ event: 'videojs:userNotHoveringOverVideo' });
  });

  // Sent to portals to synchronize the adjustment of show detail elements
  // when the video is in preview mode, on all WebKit browsers, at certain breakpoints
  // in order to make closed captions more visible
  // (text track safe area not used or styleable in WebKit)
  player.on('portalPreviewVideoIsPlayingWebKit', () => {
    sendPostMessage({ event: 'videojs:portalPreviewVideoIsPlayingWebKit' });
  });

  // Sent to portals to synchronize the opening/closing of the closed captions modal with the hiding/showing of
  // surrounding parent portal visual elements (info overlays, etc.)
  player.on('closedCaptionsSettingsOpen', () => {
    sendPostMessage({ event: 'videojs:closedCaptionsSettingsOpen' });
  });
  player.on('closedCaptionsSettingsClosed', () => {
    sendPostMessage({ event: 'videojs:closedCaptionsSettingsClosed' });
  });

  // Sent to portals to signal when the player has been mounted / initialized in the iframe
  player.on('playerReady', () => {
    sendPostMessage({ event: 'videojs:playerReady' });
  });

  // Sending some video/player info every 10 seconds to the parent page
  // Support for Frontline and other partner player experience customizations
  // e.g., resume watching without PBS SSO
  player.on('furthestPosition', (event) => {
    const messageData = event.data;
    const { position, duration, slug } = messageData;
    sendPostMessage({
      event: 'partnerPlayer:furthestPosition',
      position,
      duration,
      slug
    });
  });
}
