import * as Sentry from '@sentry/browser';
import { SeverityLevel } from '@sentry/types';
import omit from 'lodash-es/omit';
import isFunction from 'lodash-es/isFunction';
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
  Store,
} from 'redux';
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import createSentryMiddleware from 'redux-sentry-middleware';

import { getContinuousPlayVideo, getContinuousPlayVideoPassport } from './lib/api';
import { exitFullScreen } from './lib/dom';
import {
  types as playerTypes,
  PlayerState,
  playerReducer,
  getInitialPlayerState,
  playerEpic,
} from './player/store';
import {
  types as livePlayerTypes,
  LivePlayerState,
  livePlayerReducer,
  getInitialLivePlayerState,
  livePlayerEpic,
} from './live-player/store';
import {
  types as captionTypes,
  CaptionsStateVideoJs,
  captionsReducer,
  getInitialCaptionsState,
  captionsEpic,
} from './captions/store';
import {
  types as analyticsTypes,
  AnalyticsState,
  analyticsReducer,
  getInitialAnalyticsState,
  analyticsEpic,
} from './analytics/store';
import {
  types as topBarTypes,
  TopBarState,
  topBarReducer,
  getInitialTopBarState,
  topBarEpic,
} from './topbar/store';
import {
  types as continuousPlayTypes,
  ContinuousPlayState,
  continuousPlayReducer,
  continuousPlayEpic,
  getInitialContinuousPlayState,
} from './continuous-play/store';

export interface GlobalState {
  player: PlayerState;
  liveplayer: LivePlayerState;
  captions: CaptionsStateVideoJs;
  analytics: AnalyticsState;
  topBar: TopBarState;
  continuousPlay: ContinuousPlayState;
}

export const rootReducer = combineReducers({
  player: playerReducer,
  liveplayer: livePlayerReducer,
  captions: captionsReducer,
  analytics: analyticsReducer,
  topBar: topBarReducer,
  continuousPlay: continuousPlayReducer,
});

export const initialState: GlobalState = {
  player: getInitialPlayerState(),
  liveplayer: getInitialLivePlayerState(),
  captions: getInitialCaptionsState(),
  analytics: getInitialAnalyticsState(),
  topBar: getInitialTopBarState(),
  continuousPlay: getInitialContinuousPlayState(),
};

export const rootEpic = combineEpics(
  playerEpic,
  livePlayerEpic,
  captionsEpic,
  analyticsEpic,
  topBarEpic,
  continuousPlayEpic
);

const globalActionPayloadTypes = {
  ...playerTypes,
  ...livePlayerTypes,
  ...captionTypes,
  ...analyticsTypes,
  ...topBarTypes,
  ...continuousPlayTypes,
};

const debugActionMiddleware = () => (next) => (action) => {
  // This is a temporary middleware added to detect
  // When an action dispatched is not an object for the error
  // "Actions must be plain objects"
  const isValidAction = action && action.type && !isFunction(action);
  const error: SeverityLevel = 'error';
  if (!isValidAction) {
    Sentry.captureMessage(
      `Encountered an invalid action ${action}`,
      // @TODO Sentry has an internal typescript disagreement
      // - the correct type for error is SeverityLevel,
      // but the .captureMessage method expects "Severity" which is ... no longer defined
      // @ts-ignore
      error
    );
  }

  return next(action);
};

const globalActionPayloadMiddleware = (store) => (next) => (action) => {
  if (!globalActionPayloadTypes[action.type]) {
    return next(action);
  }

  const state: GlobalState = store.getState();
  const nextAction = action;
  // While we started out passing player/video/context into
  // actions manually, we found that almost all redux-observable
  // epics required player/video/context of the player.
  // This made action creators/react component include plumbing
  // boilerplate. To get rid of that, instead of passing these
  // variables though actions after actions, we can just pass it
  // to ALL actions in a single spot with a redux middlware.

  if (window['livePlayerContextBridge']) {
    // Live Player
    const livePlayer = state.liveplayer.livePlayer;
    const livePlayerContext = state.liveplayer.livePlayerContext;
    nextAction.payload = nextAction.payload || {};
    nextAction.payload.livePlayer = nextAction.payload.livePlayer || livePlayer;
    nextAction.payload.livePlayerContext =
      nextAction.payload.livePlayerContext || livePlayerContext;
  } else {
    // Player (non-livestream)
    const { player, video, context } = state.player;
    nextAction.payload = nextAction.payload || {};
    nextAction.payload.player = nextAction.payload.player || player;
    nextAction.payload.video = nextAction.payload.video || video;
    nextAction.payload.context = nextAction.payload.context || context;
  }
  return next(nextAction);
};

export function createReduxStore(): Store {
  // Enable redux devtools
  const reduxDevtool =
    window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] &&
    window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__']({
      // Ignore some payload from actions and state to avoid
      // High CPU/memory usage for serialization in Chrome
      actionSanitizer: (action) => ({
        ...action,
        payload: omit(action.payload, ['video', 'context', 'player']),
      }),
      stateSanitizer: (state) => ({
        ...state,
        player: omit(state.player, ['video', 'context', 'player']),
        liveplayer: omit(state.liveplayer, ['livePlayerContext', 'livePlayer']),
      }),
    });
  const composeEnhancers = reduxDevtool || compose;

  // Enable redux observable
  const epicDependencies = { getContinuousPlayVideo, getContinuousPlayVideoPassport, exitFullScreen };
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicDependencies,
  });

  // Enable sentry middleware
  const sentryMiddleware = createSentryMiddleware(Sentry, {
    // TODO: Implement intelligent breadcrumb filter
    filterBreadcrumbActions: () => false,
  });

  const initialStateRef: GlobalState = initialState;
  const store = createStore(
    rootReducer,
    initialStateRef,
    composeEnhancers(
      applyMiddleware(
        // Order is important here!
        // Make sure globalActionPayloadMiddleware is after epicMiddleware
        epicMiddleware,
        globalActionPayloadMiddleware,
        sentryMiddleware,
        debugActionMiddleware
      )
    )
  );

  // Bootstrap redux observable epic
  epicMiddleware.run(rootEpic);

  return store;
}
