import { ActionsObservable, combineEpics, ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import {
  map,
  distinctUntilKeyChanged,
  ignoreElements,
  tap
} from 'rxjs/operators';

import videojs, { VideoJsPlayer } from 'video.js';
import { saveState, loadState } from '../lib/local-storage';
import { LivePlayerContext } from '../bridge';
import { PBSPlayerLivestream } from './videojs';
import {
  LOCAL_STORAGE_MUTED_KEY,
  LOCAL_STORAGE_VOLUME_KEY
} from '../constants';

export interface LivePlayerAction {
  type:
    | 'LIVE_PLAYER_MOUNT'
    | 'LIVE_PLAYER_LOADED_METADATA'
    | 'LIVE_PLAYER_PLAY'
    | 'LIVE_PLAYER_PAUSE'
    | 'LIVE_PLAYER_TIME'
    | 'LIVE_PLAYER_VOLUME'
    | 'LIVE_PLAYER_MUTE'
    | 'LIVE_PLAYER_FIRST_FRAME'
    | 'LIVE_PLAYER_PROGRESS'
    | 'LIVE_PLAYER_ERROR'
    | 'LIVE_PLAYER_COMPLETE'
    | 'LIVE_PLAYER_CHANGE_CURRENT_TRACK';
  payload?: any; //eslint-disable-line
}

export interface LivePlayerState {
  playback: 'READY' | 'PLAYING' | 'PAUSED' | 'ERROR' | 'COMPLETE';
  progress: number;
  duration: number;
  livePlayer?: VideoJsPlayer;
  livePlayerContext?: LivePlayerContext;
}

export const types = {
  LIVE_PLAYER_MOUNT: 'LIVE_PLAYER_MOUNT',
  LIVE_PLAYER_LOADED_METADATA: 'LIVE_PLAYER_LOADED_METADATA',
  LIVE_PLAYER_PLAY: 'LIVE_PLAYER_PLAY',
  LIVE_PLAYER_PAUSE: 'LIVE_PLAYER_PAUSE',
  LIVE_PLAYER_TIME: 'LIVE_PLAYER_TIME',
  LIVE_PLAYER_MUTE: 'LIVE_PLAYER_MUTE',
  LIVE_PLAYER_VOLUME: 'LIVE_PLAYER_VOLUME',
  LIVE_PLAYER_FIRST_FRAME: 'LIVE_PLAYER_FIRST_FRAME',
  LIVE_PLAYER_PROGRESS: 'LIVE_PLAYER_PROGRESS',
  LIVE_PLAYER_ERROR: 'LIVE_PLAYER_ERROR',
  LIVE_PLAYER_COMPLETE: 'LIVE_PLAYER_COMPLETE',
  LIVE_PLAYER_CHANGE_CURRENT_TRACK: 'LIVE_PLAYER_CHANGE_CURRENT_TRACK',
  LIVE_PLAYER_POST_MESSAGE: 'LIVE_PLAYER_POST_MESSAGE',
};

export interface LivePlayerTimeInfo {
  type?: 'time';
  duration?: number;
  currentTime: number;
  position: number;
}

export const initialState: LivePlayerState = {
  playback: 'READY',
  progress: 0,
  duration: Infinity, // Infinity valid for livestreams
  livePlayer: undefined,
  livePlayerContext: undefined,
};

export function getInitialLivePlayerState(): LivePlayerState {
  return { ...initialState };
}

export function livePlayerReducer(
  state: LivePlayerState = initialState,
  action: LivePlayerAction
): LivePlayerState {
  switch (action.type) {
    case types.LIVE_PLAYER_MOUNT: {
      const { livePlayer, livePlayerContext } = action.payload;
      return {
        ...state,
        livePlayer,
        livePlayerContext,
      };
    }

    case types.LIVE_PLAYER_PLAY: {
      return {
        ...state,
        playback: 'PLAYING',
      };
    }
    case types.LIVE_PLAYER_PAUSE: {
      return {
        ...state,
        playback: 'PAUSED',
      };
    }
    case types.LIVE_PLAYER_PROGRESS: {
      const timeInfo: LivePlayerTimeInfo = action.payload.timeInfo;

      return {
        ...state,
        progress: timeInfo.position,
      };
    }
    case types.LIVE_PLAYER_ERROR: {
      return {
        ...state,
        playback: 'ERROR',
      };
    }
    case types.LIVE_PLAYER_COMPLETE: {
      return {
        ...state,
        playback: 'COMPLETE',
      };
    }
    case types.LIVE_PLAYER_CHANGE_CURRENT_TRACK: {
      return state;
    }
    default: {
      return state;
    }
  }
}

export function mountAction(
  livePlayer: VideoJsPlayer,
  livePlayerContext: LivePlayerContext,
  modal: videojs.ModalDialog
): LivePlayerAction {
  const payload = { livePlayer, livePlayerContext, modal };
  return { type: types.LIVE_PLAYER_MOUNT as LivePlayerAction['type'], payload };
}
export function loadedMetadataAction(
  livePlayer: VideoJsPlayer,
  livePlayerContext: LivePlayerContext
): LivePlayerAction {
  const payload = { livePlayer, livePlayerContext };
  return {
    type: types.LIVE_PLAYER_LOADED_METADATA as LivePlayerAction['type'],
    payload,
  };
}

export function playAction(): LivePlayerAction {
  return { type: types.LIVE_PLAYER_PLAY as LivePlayerAction['type'] };
}
export function pauseAction(): LivePlayerAction {
  return { type: types.LIVE_PLAYER_PAUSE as LivePlayerAction['type'] };
}
export function errorAction(livePlayer: PBSPlayerLivestream): LivePlayerAction {
  const payload = { livePlayer };
  return { type: types.LIVE_PLAYER_ERROR as LivePlayerAction['type'], payload };
}
export function firstFrameAction(
  streamStartPosition: number
): LivePlayerAction {
  const payload = { streamStartPosition };
  return {
    type: types.LIVE_PLAYER_FIRST_FRAME as LivePlayerAction['type'],
    payload,
  };
}
export function timeAction(timeInfo: LivePlayerTimeInfo): LivePlayerAction {
  const payload = { timeInfo };
  return { type: types.LIVE_PLAYER_TIME as LivePlayerAction['type'], payload };
}
export function progressAction(timeInfo: LivePlayerTimeInfo): LivePlayerAction {
  const payload = { timeInfo };
  return {
    type: types.LIVE_PLAYER_PROGRESS as LivePlayerAction['type'],
    payload,
  };
}
export function muteAction(muted: boolean): LivePlayerAction {
  const payload = { muted };
  return { type: types.LIVE_PLAYER_MUTE as LivePlayerAction['type'], payload };
}
export function volumeAction(volume: number): LivePlayerAction {
  const payload = { volume };
  return {
    type: types.LIVE_PLAYER_VOLUME as LivePlayerAction['type'],
    payload,
  };
}
export function completeAction(): LivePlayerAction {
  return { type: types.LIVE_PLAYER_COMPLETE as LivePlayerAction['type'] };
}
export function changeCurrentTrack(): LivePlayerAction {
  return {
    type: types.LIVE_PLAYER_CHANGE_CURRENT_TRACK as LivePlayerAction['type'],
  };
}
export function postMessageReceivedAction(data: unknown): LivePlayerAction {
  const payload = { data };
  return {
    type: types.LIVE_PLAYER_POST_MESSAGE as LivePlayerAction['type'],
    payload,
  };
}

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

export function progressEpic(
  action$: ActionsObservable<LivePlayerAction>
): Observable<LivePlayerAction> {
  const TIME_KEY = '__timeKey';
  const roundFn = Math.floor;

  return action$.pipe(
    ofType(types.LIVE_PLAYER_TIME as LivePlayerAction['type']),
    map((action) => {
      const { timeInfo } = action.payload;
      return {
        ...action,
        [TIME_KEY]: roundFn(timeInfo.currentTime),
      };
    }),
    distinctUntilKeyChanged(TIME_KEY),
    map((action) => {
      const { timeInfo } = action.payload;
      timeInfo.currentTime = roundFn(timeInfo.currentTime);
      return progressAction(timeInfo);
    })
  );
}

// on mount, restore previous mute state from localstorage
export function restoreMuteEpic(
  action$: ActionsObservable<LivePlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.LIVE_PLAYER_MOUNT as LivePlayerAction['type']),
    tap((action) => {
      const livePlayer: PBSPlayerLivestream = action.payload.livePlayer;
      const muted: boolean = loadState(LOCAL_STORAGE_MUTED_KEY);
      const volume = Number(loadState(LOCAL_STORAGE_VOLUME_KEY));

      // If the Player receives the muted query parameter, it will
      // override any local storage value.
      if (muted) livePlayer.muted(muted);
      if (volume) livePlayer.volume(volume);
    }),
    ignoreElements()
  );
}

// save/update the localstorage copy of the mute state on button toggle
export function mutePlayerEpic(
  action$: ActionsObservable<LivePlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.LIVE_PLAYER_MUTE as LivePlayerAction['type']),
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
  action$: ActionsObservable<LivePlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.LIVE_PLAYER_VOLUME as LivePlayerAction['type']),
    tap((action) => {
      const volume: number = action.payload.volume;
      saveState(LOCAL_STORAGE_VOLUME_KEY, volume);
    }),
    ignoreElements()
  );
}

export function errorEpic(
  action$: ActionsObservable<LivePlayerAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.LIVE_PLAYER_ERROR as LivePlayerAction['type']),
    tap((action) => {
      const livePlayer: PBSPlayerLivestream = action.payload.livePlayer;
      // Some errors could still display while the player is playing in the background.
      // Make sure that doesn't happen.
      if (!livePlayer.paused()) {
        livePlayer.pause();
      }
    }),
    ignoreElements()
  );
}

export const livePlayerEpic = combineEpics(
  progressEpic,
  restoreMuteEpic,
  mutePlayerEpic,
  volumeEpic,
  errorEpic
);
