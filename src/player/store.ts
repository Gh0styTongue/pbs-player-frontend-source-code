import { ActionsObservable, combineEpics, ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import videojs, { VideoJsPlayer } from 'video.js';
import {
  tap,
  map,
  ignoreElements,
  distinctUntilKeyChanged
} from 'rxjs/operators';
import defer from 'lodash-es/defer';

import { saveState, loadState } from '../lib/local-storage';
import { PlayerTimeInfo, VideoJsPBSPlayer } from './player';
import { Context, Video } from '../bridge';
import { PlaybackSpeedButton } from '../shared/controlbar-playback-rate';
import {
  LOCAL_STORAGE_MUTED_KEY,
  LOCAL_STORAGE_VOLUME_KEY
} from '../constants';
import { featureTrackingEvent } from '../analytics/google-analytics-4';
import { safePlay } from '../shared/safe-play';

export interface PlayerAction {
  type:
    | 'PLAYER_MOUNT'
    | 'PLAYER_LOADED_METADATA'
    | 'PLAYER_PLAY'
    | 'PLAYER_FIRST_FRAME'
    | 'PLAYER_PAUSE'
    | 'PLAYER_TIME'
    | 'PLAYER_MUTE'
    | 'PLAYER_VOLUME'
    | 'PLAYER_PROGRESS'
    | 'PLAYER_ERROR'
    | 'PLAYER_COMPLETE'
    | 'PLAYER_AD_PLAY'
    | 'PLAYER_AD_PAUSE'
    | 'PLAYER_AD_COMPLETE'
    | 'PLAYER_CHANGE_CURRENT_TRACK'
    | 'PLAYER_CHANGE_PLAYBACK_RATE';
  // There are many variations of payload in this store.
  // Can we just pass the Player instance for all actions and
  // derive what we need directly from that object?
  payload?: any; //eslint-disable-line
}

export interface PlayerState {
  playback: 'READY' | 'PLAYING' | 'PAUSED' | 'ERROR' | 'COMPLETE';
  progress: number;
  duration: number;
  player?: VideoJsPBSPlayer;
  video?: Video;
  context?: Context;
}

/**
 * ---------------------------
 * Redux action type constants
 * ---------------------------
 */

export const types = {
  PLAYER_MOUNT: 'PLAYER_MOUNT',
  PLAYER_LOADED_METADATA: 'PLAYER_LOADED_METADATA',
  PLAYER_PLAY: 'PLAYER_PLAY',
  PLAYER_FIRST_FRAME: 'PLAYER_FIRST_FRAME',
  PLAYER_PAUSE: 'PLAYER_PAUSE',
  PLAYER_TIME: 'PLAYER_TIME',
  PLAYER_MUTE: 'PLAYER_MUTE',
  PLAYER_VOLUME: 'PLAYER_VOLUME',
  PLAYER_ERROR: 'PLAYER_ERROR',
  PLAYER_PROGRESS: 'PLAYER_PROGRESS',
  PLAYER_COMPLETE: 'PLAYER_COMPLETE',
  PLAYER_AD_PLAY: 'PLAYER_AD_PLAY',
  PLAYER_AD_PAUSE: 'PLAYER_AD_PAUSE',
  PLAYER_AD_COMPLETE: 'PLAYER_AD_COMPLETE',
  PLAYER_CHANGE_PLAYBACK_RATE: 'PLAYER_CHANGE_PLAYBACK_RATE',
  PLAYER_CHANGE_CURRENT_TRACK: 'PLAYER_CHANGE_CURRENT_TRACK',
  PLAYER_CHANGE_CURRENT_AUDIO_TRACK: 'PLAYER_CHANGE_CURRENT_AUDIO_TRACK',
  PLAYER_POST_MESSAGE: 'PLAYER_POST_MESSAGE',
};

/**
 * -------------
 * Redux reducer
 * -------------
 */

export const initialState: PlayerState = {
  playback: 'READY',
  progress: 0,
  duration: 0,
  video: undefined,
  context: undefined,
};

export function getInitialPlayerState(): PlayerState {
  return { ...initialState };
}

export function playerReducer(
  state: PlayerState = initialState,
  action: PlayerAction
): PlayerState {
  switch (action.type) {
    case types.PLAYER_MOUNT: {
      const { context, video, player } = action.payload;
      return {
        ...state,
        player,
        context,
        video,
      };
    }
    case types.PLAYER_PLAY: {
      return {
        ...state,
        playback: 'PLAYING',
      };
    }
    case types.PLAYER_PAUSE: {
      return {
        ...state,
        playback: 'PAUSED',
      };
    }
    case types.PLAYER_COMPLETE: {
      return {
        ...state,
        playback: 'COMPLETE',
      };
    }
    case types.PLAYER_ERROR: {
      return {
        ...state,
        playback: 'ERROR',
      };
    }
    case types.PLAYER_AD_PLAY: {
      return {
        ...state,
        playback: 'PLAYING',
      };
    }
    case types.PLAYER_AD_PAUSE: {
      return {
        ...state,
        playback: 'PAUSED',
      };
    }
    case types.PLAYER_PROGRESS: {
      const timeInfo: PlayerTimeInfo = action.payload.timeInfo;
      return {
        ...state,
        progress: timeInfo.position,
        duration: timeInfo.duration,
      };
    }
    default: {
      return state;
    }
  }
}

/**
 * ---------------------
 * Redux action creators
 * ---------------------
 */

export function mountAction(
  player: VideoJsPBSPlayer,
  video: Video,
  context: Context,
  modal: videojs.ModalDialog
): PlayerAction {
  const payload = { player, video, context, modal };
  return { type: types.PLAYER_MOUNT as PlayerAction['type'], payload };
}

export function loadedMetadataAction(
  player: VideoJsPBSPlayer,
  video: Video,
  context: Context,
  timeInfo: PlayerTimeInfo
): PlayerAction {
  const payload = { player, video, context, timeInfo };
  return { type: types.PLAYER_LOADED_METADATA as PlayerAction['type'], payload };
}


export function playAction(): PlayerAction {
  return { type: types.PLAYER_PLAY as PlayerAction['type'] };
}

export function firstFrameAction(
  player: VideoJsPBSPlayer,
  context: Context
): PlayerAction {
  const payload = { player, context };
  return { type: types.PLAYER_FIRST_FRAME as PlayerAction['type'], payload };
}

export function pauseAction(): PlayerAction {
  return { type: types.PLAYER_PAUSE as PlayerAction['type'] };
}

export function timeAction(
  timeInfo: PlayerTimeInfo,
  video: Video
): PlayerAction {
  const payload = { timeInfo, video };
  return { type: types.PLAYER_TIME as PlayerAction['type'], payload };
}

export function muteAction(muted: boolean): PlayerAction {
  const payload = { muted };
  return { type: types.PLAYER_MUTE as PlayerAction['type'], payload };
}
export function volumeAction(volume: number): PlayerAction {
  const payload = { volume };
  return { type: types.PLAYER_VOLUME as PlayerAction['type'], payload };
}

export function progressAction(
  timeInfo: PlayerTimeInfo,
  video: Video
): PlayerAction {
  const payload = { timeInfo, video };
  return { type: types.PLAYER_PROGRESS as PlayerAction['type'], payload };
}

export function errorAction(player: VideoJsPBSPlayer): PlayerAction {
  const payload = { player };
  return { type: types.PLAYER_ERROR as PlayerAction['type'], payload };
}

export function completeAction(): PlayerAction {
  return { type: types.PLAYER_COMPLETE as PlayerAction['type'] };
}

export function playAdAction(): PlayerAction {
  return { type: types.PLAYER_AD_PLAY as PlayerAction['type'] };
}

export function pauseAdAction(): PlayerAction {
  return { type: types.PLAYER_AD_PAUSE as PlayerAction['type'] };
}

export function completeAdAction(): PlayerAction {
  return { type: types.PLAYER_AD_COMPLETE as PlayerAction['type'] };
}

export function changeCurrentAudioTrack(kind: string, context: Context): PlayerAction {
  const audioTrackKind = kind.includes('desc')
    ? 'description'
    : 'main';

  featureTrackingEvent(
    {
      feature_category: 'audio track',
      feature_name: 'audio track toggle',
      object_type: 'menu',
      object_action: `toggle to ${audioTrackKind}`,
      object_action_behavior: `changes audio track to ${audioTrackKind}`,
    },
    context,
  );
  return {
    type: types.PLAYER_CHANGE_CURRENT_AUDIO_TRACK as PlayerAction['type'],
  };
}

export function changePlaybackSpeed(
  playbackSpeedButton: PlaybackSpeedButton
): PlayerAction {
  const payload = { playbackSpeedButton };
  return {
    type: types.PLAYER_CHANGE_PLAYBACK_RATE as PlayerAction['type'],
    payload,
  };
}

export function postMessageReceivedAction(data: unknown): PlayerAction {
  const payload = { data };
  return { type: types.PLAYER_POST_MESSAGE as PlayerAction['type'], payload };
}

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

export function autoplayEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_MOUNT as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPBSPlayer | undefined =
        action.payload && action.payload.player;
      const { video } = action.payload;
      const context: Context | undefined =
        action.payload && action.payload.context;
      // If the video is marked as not Playable, don't autoplay
      if (context && context.options.autoplay && video.isPlayable) {
        defer(() => {
          // While videojs does support the autostart config option
          // in its setup parameters, we noticed that it unfortunately
          // allows muted autoplayer as specified in
          // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
          // We want to only autoplay if MEI is high enough to support
          // full autoplay, so we manually call .play instead.
          const playPromise = player && safePlay(player);

          // PLYR-460 using this pattern, as recommended by Google:
          // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Automatic playback started
              })
              .catch(() => {
                // Do nothing; browser does not allow autoplay
              });
          }
        });
      }
    }),
    ignoreElements()
  );
}

export function endscreenEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_COMPLETE as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = action.payload.player;
      const context: Context = action.payload.context;

      // If partner player has endscreen=false, once the video ends
      // we show the poster and a replay icon
      if (
        context.playerType === 'partner_player' ||
        context.playerType === 'bento_player'
      ) {
        if (player.isFullscreen()) {
          player.exitFullscreen();
        }
        player.hasStarted(false);

        const bigPlayButton = player.getChild('BigPlayButton');

        if (bigPlayButton) {
          bigPlayButton.controlText('Replay');
        }
      }
    }),
    ignoreElements()
  );
}

export function playIconEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  // Change the big play centered control text to read
  // "Pause Video" while the video is playing.
  return action$.pipe(
    ofType(types.PLAYER_PLAY as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = action.payload.player;
      if (player) {
        const bigPlayButton = player.getChild('BigPlayButton');

        bigPlayButton && bigPlayButton.controlText('Pause Video');
      }
    }),
    ignoreElements()
  );
}

export function pauseIconEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  // Change the big play centered control text to read
  // "Play Video" while the video is paused.
  return action$.pipe(
    ofType(types.PLAYER_PAUSE as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = action.payload.player;
      if (player) {
        const bigPlayButton = player.getChild('BigPlayButton');

        bigPlayButton && bigPlayButton.controlText('Play Video');
      }
    }),
    ignoreElements()
  );
}

// on mount, restore previous mute state from localstorage
export function restoreMuteEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_MOUNT as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = action.payload.player;

      const muted: boolean = loadState(LOCAL_STORAGE_MUTED_KEY);
      const volume = Number(loadState(LOCAL_STORAGE_VOLUME_KEY));

      // If the Player receives the muted query parameter, it will
      // override any local storage value.
      player && muted && player.muted(muted);
      player && volume && player.volume(volume);
    }),
    ignoreElements()
  );
}

// save/update the localstorage copy of the mute state on button toggle
export function mutePlayerEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_MUTE as PlayerAction['type']),
    tap((action) => {
      // saved as a string but parsed as a boolean when loaded
      const muted: string = action.payload.muted;
      saveState(LOCAL_STORAGE_MUTED_KEY, muted);
    }),
    ignoreElements()
  );
}

// save/update the localstorage copy of the volume setting
export function volumeEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_VOLUME as PlayerAction['type']),
    tap((action) => {
      const volume: number = action.payload.volume;
      saveState(LOCAL_STORAGE_VOLUME_KEY, volume);
    }),
    ignoreElements()
  );
}

// update the playback rate menu when it is changed
export function playbackSpeedEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_CHANGE_PLAYBACK_RATE as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPBSPlayer | undefined =
        action.payload && action.payload.player;
      if (player) {
        const controlBar = player.getChild('controlBar');

        if (controlBar) {
          const playbackSpeedButton = controlBar.getChild(
            'PlaybackSpeedButton'
          );
          if (playbackSpeedButton) {
            //@ts-ignore
            const menuItems = playbackSpeedButton.menu.children_;
            for (const menuItem in menuItems) {
              const item = menuItems[menuItem];
              if (player.playbackRate() === item.rate) {
                item.addClass('vjs-selected');
                item.el_.setAttribute('aria-checked', 'true');
                // aria-checked isn't fully supported by browsers/screen readers,
                // so indicate selected state to screen reader in the control text.
                item.controlText(', selected');
                item.isSelected_ = true;
              } else {
                item.removeClass('vjs-selected');
                item.el_.setAttribute('aria-checked', 'false');
                // Indicate un-selected state to screen reader
                item.controlText('');
                item.isSelected_ = false;
              }
            }
          }
        }
      }
    }),
    ignoreElements()
  );
}

export function progressEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<PlayerAction> {
  const TIME_KEY = '__timeKey';
  const roundFn = Math.floor;

  return action$.pipe(
    ofType(types.PLAYER_TIME as PlayerAction['type']),
    map((action) => {
      const timeInfo: PlayerTimeInfo = action.payload.timeInfo;
      return {
        ...action,
        [TIME_KEY]: roundFn(timeInfo.currentTime),
      };
    }),
    distinctUntilKeyChanged(TIME_KEY),
    map((action) => {
      const { timeInfo, video } = action.payload;
      timeInfo.currentTime = roundFn(timeInfo.currentTime);
      return progressAction(timeInfo, video);
    })
  );
}

export function shouldSeekStart(
  context: Context,
  currentPosition: number
): boolean {
  if (!context.options.start) {
    return false;
  }

  return currentPosition < context.options.start;
}

export function shouldSeekEnd(
  context: Context,
  currentPosition: number
): boolean {
  if (!context.options.end) {
    return false;
  }

  return currentPosition > context.options.end;
}

export function startEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_LOADED_METADATA as PlayerAction['type']),
    tap((action) => {
      const { player, context, timeInfo } = action.payload;
      const position: number = timeInfo.position;

      if (context.options.start && shouldSeekStart(context, position)) {
        player.currentTime(context.options.start);
        player.trigger('timeupdate');
      }
    }),
    ignoreElements()
  );
}

export function endEpic(
  action$: ActionsObservable<PlayerAction>,
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_PROGRESS as PlayerAction['type']),
    tap((action) => {
      const { player, context, video, timeInfo } = action.payload;
      const position: number = timeInfo.position;

      if (context.options.end && video.duration && shouldSeekEnd(context, position)) {
        player.currentTime(video.duration);
        player.trigger('timeupdate');
      }
    }),
    ignoreElements(),
  );
}

export function getChapterStart(
  context: Context,
  video: Video
): number | undefined {
  const { chapter } = context.options;
  const chapterInfo = chapter && video.chapters[chapter - 1];

  if (!chapterInfo) {
    return undefined;
  }

  const chapterStart = chapterInfo.start / 1000;
  return chapterStart;
}

export function shouldSeekChapter(
  context: Context,
  video: Video,
  currentPosition: number
): boolean {
  if (!context.options.chapter || !video.chapters) {
    return false;
  }

  const chapterStart = getChapterStart(context, video);
  return Boolean(chapterStart && chapterStart > currentPosition);
}

export function chapterSeekEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_PROGRESS as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = videojs.getPlayer(action.payload.player) as VideoJsPlayer;
      const context: Context = action.payload.context;
      const video: Video = action.payload.video;
      const timeInfo = action.payload.timeInfo;
      const position: number = timeInfo.position;

      if (
        context.options.chapter &&
        shouldSeekChapter(context, video, position)
      ) {
        const chapterStart = getChapterStart(context, video);
        chapterStart && player.currentTime(chapterStart);
      }
    }),
    ignoreElements()
  );
}

export function errorEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.PLAYER_ERROR as PlayerAction['type']),
    tap((action) => {
      const player: VideoJsPlayer = action.payload.player;
      // Some errors could still display while the player is playing in the background.
      // Make sure that doesn't happen.
      if (!player.paused()) {
        player.pause();
      }
    }),
    ignoreElements()
  );
}

export const playerEpic = combineEpics(
  autoplayEpic,
  endscreenEpic,
  playIconEpic,
  pauseIconEpic,
  restoreMuteEpic,
  mutePlayerEpic,
  volumeEpic,
  playbackSpeedEpic,
  progressEpic,
  startEpic,
  endEpic,
  chapterSeekEpic,
  errorEpic
);
