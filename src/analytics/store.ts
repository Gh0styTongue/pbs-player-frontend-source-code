import once from 'lodash-es/once';
import toInteger from 'lodash-es/toInteger';

import { PlayerTimeInfo, VideoJsPBSPlayer } from '../player/player';
import {
  combineEpics,
  ofType,
  ActionsObservable,
  StateObservable,
} from 'redux-observable';
import { Observable, merge, combineLatest } from 'rxjs';
import {
  map,
  filter,
  scan,
  tap,
  ignoreElements,
  debounceTime,
  distinctUntilChanged,
  throttleTime,
  first,
} from 'rxjs/operators';
import { Context, LivePlayerContext, Video, ViewingHistory } from '../bridge';
import { GlobalState } from '../store';
import { types as playerTypes, PlayerAction } from '../player/store';
import {
  LivePlayerAction,
  types as livePlayerTypes,
} from '../live-player/store';
import { isLivestream } from '../lib/islivestream';
import * as googleAnalytics4 from './google-analytics-4';
import * as profile from './profile';
import {
  initVideoJSMuxAnalytics,
  initVideoJSMuxLivePlayerAnalytics,
  getMuxOptions,
  MuxOptions,
  getMuxLivePlayerOptions,
} from './mux';
import { frontendInstrumentation } from '../lib/api';

import { continuousPlayPadding, MEDIA_START, MEDIA_STOP } from '../constants';
import { PBSPlayerLivestream } from '../live-player/videojs';

interface AnalyticsActionPayload {
  durationWatched: number;
  streamStartPosition?: number;
  position: number;
  destiation: number;
  timeInfo: PlayerTimeInfo;
  context: Context;
  livePlayerContext: LivePlayerContext;
  video: Video;
  player: VideoJsPBSPlayer;
}

interface AnalyticsAction {
  type:
    | 'SET_DURATION_WATCHED'
    | 'SET_FURTHEST_POSITION'
    | 'SET_STREAM_START_POSITION';
  payload: Partial<AnalyticsActionPayload>;
}

export interface AnalyticsState {
  durationWatched: number;
  furthestPosition: number;
  streamStartPosition?: number; // for livestream analytics
}

/**
 * ---------------------------
 * Redux action type constants
 * ---------------------------
 */

export const types = {
  SET_DURATION_WATCHED: 'SET_DURATION_WATCHED',
  SET_FURTHEST_POSITION: 'SET_FURTHEST_POSITION',
  SET_STREAM_START_POSITION: 'SET_STREAM_START_POSITION',
};

/**
 * -------------
 * Redux reducer
 * -------------
 */

export const initialState: AnalyticsState = {
  durationWatched: 0,
  furthestPosition: 0,
  streamStartPosition: 0,
};

export function getInitialAnalyticsState(): AnalyticsState {
  return { ...initialState };
}

export function analyticsReducer(
  state: AnalyticsState = initialState,
  action: AnalyticsAction
): AnalyticsState {
  switch (action.type) {
    case types.SET_DURATION_WATCHED: {
      const { durationWatched } = action.payload;
      return {
        ...state,
        durationWatched: durationWatched || 0,
      };
    }
    case types.SET_FURTHEST_POSITION: {
      let { position } = action.payload;
      position = position ? position : 0;
      if (position > state.furthestPosition) {
        return {
          ...state,
          furthestPosition: position,
        };
      }
      return state;
    }
    case types.SET_STREAM_START_POSITION: {
      const { streamStartPosition } = action.payload;
      return {
        ...state,
        streamStartPosition: streamStartPosition || 0,
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

export function setDurationWatched(duration: number): AnalyticsAction {
  const payload = { durationWatched: duration };
  return {
    type: types.SET_DURATION_WATCHED as AnalyticsAction['type'],
    payload,
  };
}

export function setFurthestPosition(position: number): AnalyticsAction {
  const payload = { position };
  return {
    type: types.SET_FURTHEST_POSITION as AnalyticsAction['type'],
    payload,
  };
}

export function setStreamStartPosition(
  streamStartPosition: number
): AnalyticsAction {
  const payload = { streamStartPosition };
  return {
    type: types.SET_STREAM_START_POSITION as AnalyticsAction['type'],
    payload,
  };
}

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

function listenOnExit(callback: EventListener) {
  // RWEB-9557 (it was an RWEB ticket with Player changes)
  // We now use 'pagehide' instead of 'beforeunload' because
  // 'beforeunload' was not firing on the new pbs.org on next.js.
  // For our purposes 'pagehide' is reliable enough for firing
  // media stops analytics events.
  window.addEventListener('pagehide', callback);
}

export function durationWatchedEpic(
  action$: ActionsObservable<AnalyticsAction>,
  state$: StateObservable<GlobalState>
): Observable<AnalyticsAction> {
  const playback$ = state$.pipe(
    map((state: GlobalState) => state.player.playback),
    distinctUntilChanged()
  );
  const tick$ = action$.pipe(
    ofType(
      playerTypes.PLAYER_PROGRESS as AnalyticsAction['type'],
      livePlayerTypes.LIVE_PLAYER_PROGRESS as AnalyticsAction['type']
    )
  );

  return combineLatest(playback$, tick$).pipe(
    filter(([playback]) => playback === 'PLAYING'),
    // Throttle by something less than 1 second to cover
    // cases where tick and scrobble happens in quick succession
    throttleTime(500),
    // Initialize the count at -1 and not 0 to account for
    // initial transition from paused to playing
    scan((accumulated: number) => accumulated + 1, -1),
    map((duration: number) => setDurationWatched(duration))
  );
}

export function furthestPositionEpic(
  action$: ActionsObservable<AnalyticsAction>
): Observable<AnalyticsAction> {
  return action$.pipe(
    ofType(
      playerTypes.PLAYER_PROGRESS as AnalyticsAction['type'],
      livePlayerTypes.LIVE_PLAYER_PROGRESS as AnalyticsAction['type']
    ),
    map((action: AnalyticsAction) => {
      const { timeInfo } = action.payload;
      return setFurthestPosition(timeInfo?.position || 0);
    }),
  );
}

export function reportingFurthestPositionEpic(
  action$: ActionsObservable<AnalyticsAction>
): Observable<AnalyticsAction> {
  return action$.pipe(
    ofType(
      playerTypes.PLAYER_PROGRESS as AnalyticsAction['type'],
    ),
    throttleTime(10000), // Throttle to only run every 10 seconds
    map((action: AnalyticsAction) => {
      const { timeInfo, player, video, context } = action.payload;
      const furthestPosition = Math.floor(timeInfo?.position || 0);
      // don't report initial first frame position
      if (furthestPosition > 1) {
        if (context?.playerType === 'partner_player') {
          player?.trigger({
            type: 'furthestPosition',
            data: {
              event: 'partnerPlayer:furthestPosition',
              position: furthestPosition,
              duration: video?.duration,
              slug: video?.slug,
            },
          });
        }
      }

    }),
    ignoreElements()
  );
}

// Livestreams have 'Infinity' duration, so our best bet to calculate how long someone has watched a stream with no finite end is to store the point in time of the whole stream (non-zero number) and do some math later when we need it.
export function streamStartPositionEpic(
  action$: ActionsObservable<AnalyticsAction>
): Observable<AnalyticsAction> {
  return action$.pipe(
    ofType(livePlayerTypes.LIVE_PLAYER_FIRST_FRAME as AnalyticsAction['type']),
    map((action: AnalyticsAction) => {
      const { streamStartPosition } = action.payload;
      return setStreamStartPosition(streamStartPosition || 0);
    })
  );
}

export function muxEpic(
  action$: ActionsObservable<AnalyticsAction>,
  __: StateObservable<GlobalState>,
  deps: Record<string, (arg0: VideoJsPBSPlayer, arg1: MuxOptions) => void>,
): Observable<AnalyticsAction> {
  const { initMux = initVideoJSMuxAnalytics } = deps;
  return action$.pipe(
    ofType(playerTypes.PLAYER_LOADED_METADATA as AnalyticsAction['type']),
    tap((action: AnalyticsAction) => {
      const { player, video, context } = action.payload;
      if (context && video && player) {
        getMuxOptions(context, video, player).then((muxOptions: MuxOptions) => {
          initMux(player, muxOptions);
        });
      }
    }),
    ignoreElements(),
  );
}

export function googleAnalyticsEventEpic(
  action$: ActionsObservable<AnalyticsAction>,
  __: StateObservable<GlobalState>,

  deps: Record<string, void>
): Observable<AnalyticsAction> {
  const { ga4 = googleAnalytics4 } = deps;
  return action$.pipe(
    ofType(playerTypes.PLAYER_PLAY as AnalyticsAction['type']),
    first(),
    tap((action: AnalyticsAction) => {
      const { context, video } = action.payload;
      if (!context || !video) return;
      frontendInstrumentation(`pbs:player:public VOD ${context.playerType} ${MEDIA_START}`);
      ga4.trackEvent(MEDIA_START, context, video);
    }),
    ignoreElements()
  );
}

export function googleAnalyticsBeaconEpic(
  action$: ActionsObservable<AnalyticsAction>,
  state$: StateObservable<GlobalState>,
  deps: Record<string, void>
): Observable<AnalyticsAction> {
  const {
    ga4 = googleAnalytics4,
    onExit = once(listenOnExit),
  } = deps;
  return action$.pipe(
    ofType(playerTypes.PLAYER_FIRST_FRAME as AnalyticsAction['type']),
    tap((action) => {
      onExit(() => {
        const { context, video } = action.payload;
        const state: GlobalState = state$.value;
        const durationWatched = toInteger(state.analytics.durationWatched);

        // PLYR-258 with the addition of the googleAnalyticsLastFrameEpic
        // we *only* want to fire this onExit MediaStop event
        // if the player is not yet complete. This prevents duplicate MediaStop
        // events if the user watches the video to the end, then
        // navigates away
        const playerNotComplete =
          state.player.playback !== 'COMPLETE' &&
          // PLYR-489 We need to make sure that not only is the video not complete,
          // but we need a little bit of wiggle room at the end of the video
          // because continuous play introduces a race condition that causes the video
          // to exit slightly before the actual last frame
          state.player.duration - state.player.progress > continuousPlayPadding;

        if (playerNotComplete && context && video) {
          frontendInstrumentation(
            `pbs:player:public VOD ${context.playerType} ${MEDIA_STOP} mid-playback`,
          );
          ga4.trackEvent(MEDIA_STOP, context, video, {
            value: durationWatched,
          });
        }
      });
    }),
    ignoreElements()
  );
}

export function googleAnalyticsLastFrameEpic(
  action$: ActionsObservable<AnalyticsAction>,
  state$: StateObservable<GlobalState>,
  deps: Record<string, void>
): Observable<AnalyticsAction> {
  const { ga4 = googleAnalytics4 } = deps;
  return action$.pipe(
    ofType(playerTypes.PLAYER_COMPLETE as AnalyticsAction['type']),
    tap((action: AnalyticsAction) => {
      const { context, video } = action.payload;
      const state: GlobalState = state$.value;
      const durationWatched = toInteger(state.analytics.durationWatched);
      if (!context || !video) return;
      frontendInstrumentation(
        `pbs:player:public VOD ${context.playerType} ${MEDIA_STOP} last frame`,
      );
      ga4.trackEvent(MEDIA_STOP, context, video, {
        value: durationWatched,
      });
    }),
    ignoreElements()
  );
}

/* -------------------------- */
/* GA Livestream */
/* -------------------------- */
export function googleAnalyticsLivePlayerEventEpic(
  action$: ActionsObservable<LivePlayerAction>,
  __: StateObservable<GlobalState>,
  deps: Record<string, void>
): Observable<LivePlayerAction> {
  const { ga4 = googleAnalytics4 } = deps;
  return action$.pipe(
    ofType(livePlayerTypes.LIVE_PLAYER_FIRST_FRAME as LivePlayerAction['type']),
    tap((action: LivePlayerAction) => {
      const { livePlayerContext } = action.payload;
      if (!livePlayerContext) return;
      frontendInstrumentation(
        `pbs:player:public Livestream ${livePlayerContext.playerType} ${MEDIA_START}`,
      );
      ga4.trackLiveEvent(MEDIA_START, livePlayerContext);
    }),
    ignoreElements()
  );
}

export function googleAnalyticsLivePlayerBeaconEpic(
  action$: ActionsObservable<LivePlayerAction>,
  state$: StateObservable<GlobalState>,
  deps: Record<string, void>
): Observable<LivePlayerAction> {
  const {
    ga4 = googleAnalytics4,
    onExit = once(listenOnExit),
  } = deps;
  return action$.pipe(
    ofType(livePlayerTypes.LIVE_PLAYER_FIRST_FRAME as LivePlayerAction['type']),
    tap((action: LivePlayerAction) => {
      onExit(() => {
        const { livePlayerContext } = action.payload;
        const state: GlobalState = state$.value;
        const farthestStreamPosition = toInteger(state.liveplayer.progress);
        const streamStartPosition = toInteger(
          state.analytics.streamStartPosition
        );
        const streamDurationWatched =
          farthestStreamPosition - streamStartPosition;

        if (!livePlayerContext) return;
        frontendInstrumentation(
          `pbs:player:public Livestream ${livePlayerContext.playerType} ${MEDIA_STOP}`,
        );
        ga4.trackLiveEvent(MEDIA_STOP, livePlayerContext, {
          value: streamDurationWatched > 0 ? streamDurationWatched : 0,
        });
      });
    }),
    ignoreElements()
  );
}

export function muxLivePlayerEpic(
  action$: ActionsObservable<LivePlayerAction>,
  __: StateObservable<GlobalState>,
  deps: Record<string, (arg0: PBSPlayerLivestream, arg1: MuxOptions) => void>,
): Observable<LivePlayerAction> {
  const { initMux = initVideoJSMuxLivePlayerAnalytics } = deps;
  return action$.pipe(
    ofType(
      livePlayerTypes.LIVE_PLAYER_LOADED_METADATA as LivePlayerAction['type'],
    ),
    tap((action: LivePlayerAction) => {
      const { livePlayerContext, livePlayer } = action.payload;
      if (livePlayerContext && livePlayer) {
        getMuxLivePlayerOptions(livePlayer, livePlayerContext).then((muxOptions: MuxOptions) => {
          initMux(livePlayer, muxOptions);
        });
      }
    }),
    ignoreElements(),
  );
}

export const shouldResumeHistory = (
  video: Video,
  viewingHistory?: ViewingHistory
): boolean => {
  const secondsWatched = (viewingHistory && viewingHistory.secondsWatched) || 0;
  if (!secondsWatched) {
    return false;
  }

  const viewedRatio = secondsWatched / video.duration;
  return secondsWatched > 30 && viewedRatio < 0.95;
};

export const shouldAddToHistory = (state: GlobalState): boolean => {
  return state.player.progress > 30;
};

export const resumeProfileViewingHistoryEpic = (
  action$: ActionsObservable<AnalyticsAction>
): Observable<AnalyticsAction> => {
  return action$.pipe(
    ofType(playerTypes.PLAYER_FIRST_FRAME as AnalyticsAction['type']),
    tap((action: AnalyticsAction) => {
      const { video, context } = action.payload;
      const player: VideoJsPBSPlayer | undefined = action.payload.player;
      if (video && player) {
        const viewingHistory: ViewingHistory =
          context?.viewingHistory[video?.id || 0];
        if (shouldResumeHistory(video, viewingHistory)) {
          if (viewingHistory.secondsWatched) {
            player.currentTime(viewingHistory.secondsWatched);
          }
        }
      }
    }),
    ignoreElements()
  );
};

export const profileViewingHistoryEpic = (
  action$: ActionsObservable<PlayerAction>,
  state$: StateObservable<GlobalState>
): Observable<PlayerAction> => {
  const complete$ = action$.pipe(
    ofType(playerTypes.PLAYER_COMPLETE as PlayerAction['type'])
  );
  const pause$ = action$.pipe(
    // because a pause event is one of the more potentially frequently
    // occurring player events, we debounce with an arbitrarily long
    // duration (5 seconds), to make sure that we capture the last paused
    // location without overloading profile services with requests.
    ofType(playerTypes.PLAYER_PAUSE as PlayerAction['type']),
    debounceTime(5 * 1000)
  );

  return merge(complete$, pause$).pipe(
    filter((action) => {
      const player: VideoJsPBSPlayer = action.payload.player;
      // Don't process profile viewing history for VOD Livestreams
      return !isLivestream(player);
    }),
    tap((action: PlayerAction) => {
      const { video, context } = action.payload;
      const state: GlobalState = state$.value;

      if (shouldAddToHistory(state)) {
        video &&
          context &&
          profile.addToViewingHistory(video, context, state.player.progress);
      }
    }),
    ignoreElements()
  );
};

export const profileViewingHistoryBeaconEpic = (
  action$: ActionsObservable<AnalyticsAction>,
  state$: StateObservable<GlobalState>,
  deps: Record<string, void>
): Observable<AnalyticsAction> => {
  const { onExit = once(listenOnExit) } = deps;
  return action$.pipe(
    ofType(playerTypes.PLAYER_MOUNT as AnalyticsAction['type']),
    tap((action: AnalyticsAction) => {
      const { video, context } = action.payload;
      const player: VideoJsPBSPlayer | undefined = action.payload.player;

      onExit(() => {
        if (player && isLivestream(player)) {
          // No need to write to profile if the video is a livestream
          return;
        }
        const state: GlobalState = state$.value;
        if (shouldAddToHistory(state)) {
          video &&
            context &&
            profile.addToViewingHistory(video, context, state.player.progress, {
              useBeacon: true,
            });
        }
      });
    }),
    ignoreElements()
  );
};

const buildEpics: typeof combineEpics = combineEpics;

export const analyticsEpic = buildEpics(
  durationWatchedEpic,
  furthestPositionEpic,
  streamStartPositionEpic,
  muxEpic,
  muxLivePlayerEpic,
  googleAnalyticsLivePlayerEventEpic,
  googleAnalyticsEventEpic,
  googleAnalyticsLivePlayerBeaconEpic,
  googleAnalyticsBeaconEpic,
  googleAnalyticsLastFrameEpic,
  resumeProfileViewingHistoryEpic,
  profileViewingHistoryEpic,
  profileViewingHistoryBeaconEpic,
  reportingFurthestPositionEpic
);
