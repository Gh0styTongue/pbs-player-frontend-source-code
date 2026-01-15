import { ActionsObservable, combineEpics, ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { tap, ignoreElements } from 'rxjs/operators';
import { VideoJsPBSPlayer } from '../player/player';

export type ScreenState = 'CLOSED' | 'INFO' | 'EMBED' | 'SHARE' | 'SHOP';

export interface TopBarState {
  screen: ScreenState;
}

export interface TopBarAction {
  type: 'OPEN_TOPBAR_SCREEN' | 'CLOSE_TOPBAR_SCREEN';
  payload?: TopBarPayload;
}

export interface TopBarPayload {
  player?: VideoJsPBSPlayer;
  screen?: ScreenState;
}

/**
 * ---------------------------
 * Redux action type constants
 * ---------------------------
 */

export const types = {
  OPEN_TOPBAR_SCREEN: 'OPEN_TOPBAR_SCREEN',
  CLOSE_TOPBAR_SCREEN: 'CLOSE_TOPBAR_SCREEN',
};

/**
 * -------------
 * Redux reducer
 * -------------
 */

export const initialState: TopBarState = {
  screen: 'CLOSED',
};

export function getInitialTopBarState(): TopBarState {
  return { ...initialState };
}

export function topBarReducer(
  state: TopBarState = initialState,
  action: TopBarAction
): TopBarState {
  switch (action.type) {
    case types.OPEN_TOPBAR_SCREEN: {
      const screen: ScreenState | undefined = action.payload?.screen;
      if (screen) {
        return {
          ...state,
          screen,
        };
      } else {
        return { ...state };
      }
    }
    case types.CLOSE_TOPBAR_SCREEN: {
      return {
        ...state,
        screen: 'CLOSED',
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

export const openTopBarScreen = (screen: ScreenState): TopBarAction => {
  const payload = { screen };
  return { type: types.OPEN_TOPBAR_SCREEN as TopBarAction['type'], payload };
};

export const openTopBarInfoScreen = (): TopBarAction =>
  openTopBarScreen('INFO');
export const openTopBarEmbedScreen = (): TopBarAction =>
  openTopBarScreen('EMBED');
export const openTopBarShareScreen = (): TopBarAction =>
  openTopBarScreen('SHARE');
export const openTopBarShopScreen = (): TopBarAction =>
  openTopBarScreen('SHOP');

export const closeTopBarScreen = (player: VideoJsPBSPlayer): TopBarAction => {
  const payload = { player };
  return { type: types.CLOSE_TOPBAR_SCREEN as TopBarAction['type'], payload };
};

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

export function topBarPauseEpic(
  action$: ActionsObservable<TopBarAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.OPEN_TOPBAR_SCREEN as TopBarAction['type']),
    tap((action) => {
      const player: VideoJsPBSPlayer | undefined =
        action && action.payload && action.payload.player;
      if (player && !player.paused()) {
        player.pause();
      }
    }),
    ignoreElements()
  );
}

export const topBarEpic = combineEpics(topBarPauseEpic);
