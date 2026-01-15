import {
  ActionsObservable,
  combineEpics,
  ofType,
  StateObservable,
} from 'redux-observable';
import { Observable, from } from 'rxjs';
import {
  filter,
  first,
  distinctUntilChanged,
  map,
  mergeMap,
  ignoreElements,
  tap,
} from 'rxjs/operators';

import { sendContinuousPlayCommand } from './iframe';
import { PlayerAction, types as playerTypes } from '../player/store';
import { isLivestream } from '../lib/islivestream';
import { ContinuousPlayData } from '../lib/api';
import { Context, Video } from '../bridge';
import { VideoJsPBSPlayer } from '../player/player';
import { NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO } from '../constants';

import { GlobalState } from '../store';

// To avoid users seeing the endscreen, we'll navigate the users
// to the next video about ~2 seconds before the video ends.
// Note that this will also offset the countdown number by ~2 seconds.
export const REFRESH_PADDING = 0; // Padding is disabled for now

export interface ContinuousPlayState {
  status: string;
  countdownSeconds?: number;
  countdownThresholdSeconds?: number;
  payloadStatus: string;
  payload?: ContinuousPlayData;
  includePassport?: boolean;
  isPlayingAd?: boolean;
}

export type ContinuousPlayActionType =
  | 'CONTINUOUS_PLAY_PAYLOAD_REQUESTED'
  | 'CONTINUOUS_PLAY_PAYLOAD_FETCHED'
  | 'CONTINUOUS_PLAY_PAYLOAD_FAILED'
  | 'CONTINUOUS_PLAY_CANCEL_COUNTDOWN'
  | 'CONTINUOUS_PLAY_ENABLE_COUNTDOWN'
  | 'CONTINUOUS_PLAY_EXCLUDE_PASSPORT'
  | 'CONTINUOUS_PLAY_INCLUDE_PASSPORT'
  | 'CONTINUOUS_PLAY_SEND_COMMAND';

export interface ContinuousPlayAction {
  type: ContinuousPlayActionType;
  payload?: any; //eslint-disable-line
}

export function getFetchPayloadThreshold(video: Video): number {
  if (video.videoType === 'full_length') {
    return 40;
  }

  return 20;
}

export function getCountdownThreshold(video: Video): number {
  if (video.videoType === 'full_length') {
    // PLYR-311 - full_length assets have a countdown of 30 seconds
    return 30;
  }
  // Non full-length assets have a 10 second countdown
  return 10;
}

export function hasCountdownFinished(
  continuousPlayState: ContinuousPlayState,
  paddingSeconds = 0.15
): boolean {
  return (
    continuousPlayState.status === status.COUNTDOWN &&
    typeof continuousPlayState.countdownSeconds === 'number' &&
    continuousPlayState.countdownSeconds < paddingSeconds
  );
}

export function isContinuousPlayEnabled(context?: Context): boolean {
  if (!context) {
    return false;
  }

  // Only enable this on .org and svp
  const isPortalOrSVP =
    context.playerType === 'portal_player' ||
    context.playerType === 'station_player';

  // prevent "Watch Preview" modals on video playback pages from redirecting to ContinuousPlay.
  const isDisabled = context.options.unsafeDisableContinuousPlay;

  return isPortalOrSVP && !isDisabled;
}

/**
 * ---------------------------
 * Redux action type constants
 * ---------------------------
 */

export const types = {
  CONTINUOUS_PLAY_PAYLOAD_REQUESTED: 'CONTINUOUS_PLAY_PAYLOAD_REQUESTED',
  CONTINUOUS_PLAY_PAYLOAD_FETCHED: 'CONTINUOUS_PLAY_DATA_FETCHED',
  CONTINUOUS_PLAY_PAYLOAD_FAILED: 'CONTINUOUS_PLAY_DATA_FAILED',
  CONTINUOUS_PLAY_CANCEL_COUNTDOWN: 'CONTINUOUS_PLAY_CANCEL_COUNTDOWN',
  CONTINUOUS_PLAY_ENABLE_COUNTDOWN: 'CONTINUOUS_PLAY_ENABLE_COUNTDOWN',
  CONTINUOUS_PLAY_EXCLUDE_PASSPORT: 'CONTINUOUS_PLAY_EXCLUDE_PASSPORT',
  CONTINUOUS_PLAY_INCLUDE_PASSPORT: 'CONTINUOUS_PLAY_INCLUDE_PASSPORT',
  CONTINUOUS_PLAY_SEND_COMMAND: 'CONTINUOUS_PLAY_SEND_COMMAND',
};

/**
 * -------------
 * Redux reducer
 * -------------
 */

export const status = {
  // Standby means that nothing has been done yet because not enough
  // Of the video has been done to start the continuous play logic.
  STANDBY: 'STANDBY',
  // Once enough of the video has been watched, we can transition to
  // A countdown mode and display the Continuous Play overlay.
  COUNTDOWN: 'COUNTDOWN',
  // Cancelled means that the user has manually opted out of the continuous play
  // For this particular video.
  CANCELLED: 'CANCELLED',
};

export const payloadStatus = {
  INITIALIZED: 'INITIALIZED',
  FETCHED: 'FETCHED',
  FAILED: 'FAILED',
};

export const initialState = {
  status: status.STANDBY,
  countdownSeconds: undefined,
  countdownThresholdSeconds: undefined,
  payloadStatus: payloadStatus.INITIALIZED,
  payload: undefined,
  includePassport: true,
  isPlayingAd: false,
};

export function getInitialContinuousPlayState(): ContinuousPlayState {
  return { ...initialState };
}

export function continuousPlayReducer(
  state: ContinuousPlayState = initialState,
  action: ContinuousPlayAction
): ContinuousPlayState {
  switch (action.type) {
    case types.CONTINUOUS_PLAY_PAYLOAD_FETCHED: {
      const { data } = action.payload;
      return {
        ...state,
        payloadStatus: payloadStatus.FETCHED,
        payload: data,
      };
    }
    case types.CONTINUOUS_PLAY_PAYLOAD_FAILED: {
      return {
        ...state,
        payloadStatus: payloadStatus.FAILED,
      };
    }
    case types.CONTINUOUS_PLAY_CANCEL_COUNTDOWN: {
      return {
        ...state,
        status: status.CANCELLED,
      };
    }
    case types.CONTINUOUS_PLAY_ENABLE_COUNTDOWN: {
      return {
        ...state,
        status:
          state.status === status.COUNTDOWN ? status.COUNTDOWN : status.STANDBY,
      };
    }
    case types.CONTINUOUS_PLAY_EXCLUDE_PASSPORT: {
      return {
        ...state,
        includePassport: false,
      };
    }
    case types.CONTINUOUS_PLAY_INCLUDE_PASSPORT: {
      return {
        ...state,
        includePassport: true,
      };
    }
    case playerTypes.PLAYER_AD_PLAY: {
      return {
        ...state,
        isPlayingAd: true,
      };
    }
    case playerTypes.PLAYER_AD_COMPLETE: {
      return {
        ...state,
        isPlayingAd: false,
      };
    }
    case playerTypes.PLAYER_TIME: {
      if (state.payloadStatus !== payloadStatus.FETCHED) {
        // If continuous play data has not been fetched, there's no
        // video metadata to display. We'll just wait till
        // subsequent progress ticks to display
        return { ...state };
      }
      const { timeInfo, video } = action.payload;

      const currentPosition: number = timeInfo.position;
      const duration: number = timeInfo.duration;

      const countdownThresholdSeconds =
        state.countdownThresholdSeconds || getCountdownThreshold(video);
      const isWithinThreshold =
        duration - currentPosition <
        countdownThresholdSeconds + REFRESH_PADDING;
      let nextStatus =
        state.status !== status.CANCELLED
          ? isWithinThreshold
            ? status.COUNTDOWN
            : status.STANDBY
          : state.status;
      nextStatus = state.isPlayingAd ? status.STANDBY : nextStatus;
      const nextCounddownSeconds =
        nextStatus === status.COUNTDOWN
          ? Math.round(duration - currentPosition) - REFRESH_PADDING
          : state.countdownSeconds;

      return {
        ...state,
        status: nextStatus,
        countdownThresholdSeconds,
        countdownSeconds: nextCounddownSeconds,
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

export function requestContinuousPlay(): ContinuousPlayAction {
  return {
    type: types.CONTINUOUS_PLAY_PAYLOAD_REQUESTED as ContinuousPlayAction['type'],
  };
}

export function fetchContinuousPlaySuccess(data: ContinuousPlayData): ContinuousPlayAction {
  const payload = { data };
  return {
    type: types.CONTINUOUS_PLAY_PAYLOAD_FETCHED as ContinuousPlayAction['type'],
    payload,
  };
}

export function fetchContinuousPlayFailed(): ContinuousPlayAction {
  return { type: types.CONTINUOUS_PLAY_PAYLOAD_FAILED as ContinuousPlayAction['type'] };
}

export function cancelCountDown(): ContinuousPlayAction {
  return { type: types.CONTINUOUS_PLAY_CANCEL_COUNTDOWN as ContinuousPlayAction['type'] };
}

export function enableCountDown(): ContinuousPlayAction {
  return { type: types.CONTINUOUS_PLAY_ENABLE_COUNTDOWN as ContinuousPlayAction['type'] };
}

export function excludePassportContent(): ContinuousPlayAction {
  return { type: types.CONTINUOUS_PLAY_EXCLUDE_PASSPORT as ContinuousPlayAction['type'] };
}

export function includePassportContent(): ContinuousPlayAction {
  return { type: types.CONTINUOUS_PLAY_INCLUDE_PASSPORT as ContinuousPlayAction['type'] };
}

export function sendCommand(
  passive: boolean,
  command: string,
  continuousPlayData?: ContinuousPlayData
): ContinuousPlayAction {
  const payload = { command, continuousPlayData, passive };
  return { type: types.CONTINUOUS_PLAY_SEND_COMMAND as ContinuousPlayAction['type'], payload };
}

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

export function requestContinuousPlayEpic(
  action$: Observable<ContinuousPlayAction>
): Observable<unknown> {
  return action$.pipe(
    ofType(playerTypes.PLAYER_PROGRESS as ContinuousPlayAction['type']),
    filter((action) => {
      const player: VideoJsPBSPlayer = action.payload.player;
      return !isLivestream(player);
    }),
    filter((action: ContinuousPlayAction) => {
      const { video, timeInfo } = action.payload;

      const currentPosition: number = timeInfo.position;
      const duration: number = timeInfo.duration;

      return duration - currentPosition < getFetchPayloadThreshold(video);
    }),
    first(),
    map((action) => {
      const context: Context = action.payload.context;

      if (!isContinuousPlayEnabled(context)) {
        return null;
      }
      return requestContinuousPlay();
    }),
    filter(Boolean)
  );
}

export function fetchContinuousPlayEpic(
  action$: ActionsObservable<ContinuousPlayAction>,
  state$: StateObservable<GlobalState>,
  deps: Record<
    string,
    (arg0: string, arg1: string, arg2: string | undefined) => Promise<ContinuousPlayData>
  >,
): Observable<ContinuousPlayAction> {
  const { getContinuousPlayVideo, getContinuousPlayVideoPassport } = deps;
  return action$.pipe(
    ofType(types.CONTINUOUS_PLAY_PAYLOAD_REQUESTED as ContinuousPlayAction['type']),
    mergeMap((action) => {
      const context: Context = action.payload.context;
      const video: Video = action.payload.video;
      const passportIncluded = state$.value.continuousPlay.includePassport;

      if (passportIncluded) {
        return from(
          getContinuousPlayVideoPassport(video.slug, context.stationId, context.userId)
            .then((data: ContinuousPlayData) => fetchContinuousPlaySuccess(data))
            .catch(() => fetchContinuousPlayFailed())
        );
      } else {
        return from(
          getContinuousPlayVideo(video.slug, context.stationId, context.userId)
            .then((data: ContinuousPlayData) => fetchContinuousPlaySuccess(data))
            .catch(() => fetchContinuousPlayFailed())
        );
      }
    })
  );
}

export function sendIframeCommandEpic(
  __: Observable<unknown>,
  state$: StateObservable<GlobalState>
): Observable<ContinuousPlayAction> {
  return state$.pipe(
    filter((state) => {
      const context: Context | undefined = state.player.context;
      return isContinuousPlayEnabled(context);
    }),
    filter((state) => {
      const continuousPlay: ContinuousPlayState = state.continuousPlay;
      return hasCountdownFinished(continuousPlay);
    }),
    first(),
    map((state) => {
      const continuousPlay: ContinuousPlayState = state.continuousPlay;
      return sendCommand(true, NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO, continuousPlay.payload);
    })
  );
}

export function handleSendCommandEpic(
  action$: ActionsObservable<ContinuousPlayAction>
): Observable<ContinuousPlayAction> {
  return action$.pipe(
    ofType(types.CONTINUOUS_PLAY_SEND_COMMAND as ContinuousPlayAction['type']),
    filter((action) => {
      const context: Context = action.payload.context;
      return isContinuousPlayEnabled(context);
    }),
    tap((action) => {
      const {
        continuousPlayData,
        passive,
        command,
        context,
      } = action.payload;
      // const continuousPlayData: ContinuousPlayData = action.payload.continuousPlayData;
      // const passive: boolean = action.payload.passive;
      sendContinuousPlayCommand(passive, command, continuousPlayData, context);
    }),
    ignoreElements()
  );
}

export function handleReceiveCommandEpic(
  action$: ActionsObservable<PlayerAction>
): Observable<unknown> {
  return action$.pipe(
    ofType(playerTypes.PLAYER_POST_MESSAGE as PlayerAction['type']),
    filter((action) => {
      const context: Context = action.payload.context;
      return isContinuousPlayEnabled(context);
    }),
    map(
      (action) =>
        action.payload && action.payload.data && action.payload.data.command
    ),
    map((command) => {
      if (command === 'disableContinuousPlay') {
        return cancelCountDown();
      }

      if (command === 'enableContinuousPlay') {
        return enableCountDown();
      }

      if (command === 'excludePassportContinuousPlay') {
        return excludePassportContent();
      }

      if (command === 'includePassportContinuousPlay') {
        return includePassportContent();
      }

      return null;
    }),
    filter(Boolean)
  );
}

export function exitFullScreenEpic(
  __: Observable<unknown>,
  state$: StateObservable<GlobalState>,
  deps: Record<string, () => void>
): Observable<Response> {
  return state$.pipe(
    filter((state) => {
      const context: Context | undefined = state.player.context;
      return isContinuousPlayEnabled(context);
    }),
    map((state) => {
      const continuousPlay: ContinuousPlayState = state.continuousPlay;
      return continuousPlay.status;
    }),
    distinctUntilChanged(),
    tap((nextStatus) => {
      const startedCountdown = nextStatus === status.COUNTDOWN;
      if (startedCountdown) {
        const { exitFullScreen } = deps;
        exitFullScreen();
      }
    }),
    ignoreElements()
  );
}

export const continuousPlayEpic = combineEpics(
  requestContinuousPlayEpic,
  fetchContinuousPlayEpic,
  sendIframeCommandEpic,
  handleSendCommandEpic,
  handleReceiveCommandEpic,
  exitFullScreenEpic
);
