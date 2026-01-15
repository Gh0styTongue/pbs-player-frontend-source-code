import forEach from 'lodash-es/forEach';
import isString from 'lodash-es/isString';
import isFunction from 'lodash-es/isFunction';

import { Video } from '../bridge';
import { VideoJsPBSPlayer } from './player';
import { VideoJsPlayer } from 'video.js';

function getLegacyVideoInfo(video: Video) {
  return {
    title: video.title,
    airdate: video.airDate,
    duration: video.duration,
    program: {
      title: video.program && video.program.title,
      slug: video.program && video.program.slug,
    },
  };
}

const videojsEventToPostMessage = {
  play: 'video::playing',
  idle: 'video::finished',
  pause: 'video::paused',
  ended: 'video::finished',
  seeking: 'video::seeking',
  seeked: 'video::seeked',
  adImpression: 'ad::started',
  adComplete: 'ad::complete',
};

export const sendPostMessages = (
  player: VideoJsPBSPlayer,
  video: Video
): void => {
  if (!document.referrer) {
    // Don't send postMessage if it's not in an iframe
    return;
  }

  // send initialized post messages
  parent.postMessage('initialized', document.referrer);

  // send videoInfo post messages
  const videoInfoMessage =
    'videoInfo::' + JSON.stringify(getLegacyVideoInfo(video));
  parent.postMessage(videoInfoMessage, document.referrer);

  // send post messages with mappings
  forEach(videojsEventToPostMessage, (value, key) => {
    const videoJsEvent: string = key;
    const postMessage: string = value;

    player.on(videoJsEvent, () => {
      parent.postMessage(postMessage, document.referrer);
    });
  });
};

export const dispatchPartnerMessages = (player: VideoJsPlayer): void => {
  player.on('furthestPosition', (event) => {
    const messageData = event.data;

    if (!document.referrer) {
      // Don't send postMessage if it's not in an iframe
      return;
    }
    parent.postMessage(JSON.stringify(messageData), document.referrer);
  });
};

const handlePostMessage = (player: VideoJsPBSPlayer, event): void => {
  const data = event.data;

  if (!isString(data)) {
    return;
  }

  const action = data.split('::')[0];
  const value = data.split('::')[1];

  const noResponse = ['play', 'pause', 'seek', 'stop'];
  const deniedEvents = ['initialized', 'video', 'videoInfo'];
  let sendToPlayer = true;

  if (deniedEvents.indexOf(action) !== -1) {
    sendToPlayer = false;
  }

  if (!value) {
    let response;
    if (sendToPlayer && action) {
      response = isFunction(player[action]) && player[action]();
    }
    if (noResponse.indexOf(action) === -1) {
      event.source &&
        event.source.postMessage(action + '::' + response, event.origin);
    }
  } else {
    if (sendToPlayer) {
      isFunction(player[action]) && player[action](value);
    }
  }
};

export const listenToPostMessages = (player: VideoJsPBSPlayer): void => {
  window.addEventListener(
    'message',
    (event) => handlePostMessage(player, event),
    false
  );
};
