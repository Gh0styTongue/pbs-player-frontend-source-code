import { Observable } from 'rxjs';
import videojs, { VideoJsPlayer } from 'video.js';
import { tap, mergeMap, ignoreElements } from 'rxjs/operators';
import {
  ActionsObservable,
  combineEpics,
  ofType,
  StateObservable,
} from 'redux-observable';
import { saveState, loadState } from '../lib/local-storage';
import { elements } from '../constants';
import {
  toggleButtonOn,
  toggleButtonOff,
  deselectAllItems,
  selectItemByLabel,
} from './toggle-captions';
import { GlobalState } from '../store';
import { VideoJsPBSPlayer } from '../player/player';

import { CaptionsStyleVideoJs } from './preview-styles';
import { Context, LivePlayerContext } from '../bridge';
import { getNativeName } from '../lib/get-native-name';
import { filterTextTrackList } from './filter-text-track-list';
import { getTextTracks } from '../shared/text-tracks';

// Note that whenever the shape/schema of caption state changes in a
// backwards incompatible way, we need to change the local storage key
export const CAPTIONS_LOCAL_STORAGE_KEY = 'captions-v2';
export const CAPTIONS_SELECTION_KEY = 'player.captions.selected';

export type CaptionsActionType =
  | 'INIT_CAPTIONS_SETTINGS'
  | 'OPEN_CAPTIONS_SETTINGS'
  | 'CLOSE_CAPTIONS_SETTINGS'
  | 'CHANGE_CAPTIONS_SETTINGS'
  | 'SAVE_CAPTIONS_SETTINGS'
  | 'ADD_TEXT_TRACK'
  | 'ADD_SIDECAR_CAPTION'
  | 'CHANGE_CURRENT_TEXT_TRACK';

export interface CaptionsPayload {
  player?: VideoJsPBSPlayer;
  livePlayer?: VideoJsPlayer;
  context?: Context;
  livePlayerContext?: LivePlayerContext;
  previewStyle?: Partial<CaptionsStyleVideoJs>;
  modal?: videojs.ModalDialog;
  track?: videojs.TextTrackOptions;
  trackLanguage?: videojs.TextTrackOptions['language'];
  closedCaptionsButton?: videojs.Component;
  isSafari?: boolean;
}
export interface CaptionsAction {
  type: CaptionsActionType;
  payload: CaptionsPayload;
}

export interface CaptionsStateVideoJs {
  isSettingsOpen: boolean;
  playerStyle: CaptionsStyleVideoJs;
  previewStyle: CaptionsStyleVideoJs;
  modal?: videojs.ModalDialog;
}

/**
 * ---------------------------
 * Redux action type constants
 * ---------------------------
 */

export const types = {
  INIT_CAPTIONS_SETTINGS: 'INIT_CAPTIONS_SETTINGS',
  LAUNCH_CAPTIONS_MODAL: 'LAUNCH_CAPTIONS_MODAL',
  OPEN_CAPTIONS_SETTINGS: 'OPEN_CAPTIONS_SETTINGS',
  CLOSE_CAPTIONS_SETTINGS: 'CLOSE_CAPTIONS_SETTINGS',
  CHANGE_CAPTIONS_SETTINGS: 'CHANGE_CAPTIONS_SETTINGS',
  SAVE_CAPTIONS_SETTINGS: 'SAVE_CAPTIONS_SETTINGS',
  ADD_TEXT_TRACK: 'ADD_TEXT_TRACK',
  ADD_SIDECAR_CAPTION: 'ADD_SIDECAR_CAPTION',
  CHANGE_CURRENT_TEXT_TRACK: 'CHANGE_CURRENT_TEXT_TRACK',
};

/**
 * -------------
 * Redux reducer
 * -------------
 */

export const initialState: CaptionsStateVideoJs = {
  isSettingsOpen: false,
  playerStyle: {
    fontPercent: '1.00',
    fontFamily: 'proportionalSansSerif',
    edgeStyle: 'none',
    color: '#FFF',
    fontOpacity: '1',
    backgroundColor: '#000',
    backgroundOpacity: '1',
    windowColor: '#000',
    windowOpacity: '0',
  },
  previewStyle: {
    fontPercent: '1.00',
    fontFamily: 'proportionalSansSerif',
    edgeStyle: 'none',
    color: '#FFF',
    fontOpacity: '1',
    backgroundColor: '#000',
    backgroundOpacity: '1',
    windowColor: '#000',
    windowOpacity: '0',
  },
};

export function getInitialCaptionsState(): CaptionsStateVideoJs {
  const persistedState = loadState(CAPTIONS_LOCAL_STORAGE_KEY);
  return { ...initialState, ...persistedState };
}

export function captionsReducer(
  state: CaptionsStateVideoJs = initialState,
  action: CaptionsAction
): CaptionsStateVideoJs {
  switch (action.type) {
    case types.LAUNCH_CAPTIONS_MODAL: {
      const { modal } = action.payload;

      return {
        ...state,
        modal,
      };
    }
    case types.OPEN_CAPTIONS_SETTINGS: {
      const { modal } = action.payload;

      return {
        ...state,
        modal,
        isSettingsOpen: true,
      };
    }
    case types.CLOSE_CAPTIONS_SETTINGS: {
      const { modal } = action.payload;
      const previewStyle = {
        ...state.playerStyle,
      };
      return {
        ...state,
        modal,
        previewStyle,
        isSettingsOpen: false,
      };
    }
    case types.CHANGE_CAPTIONS_SETTINGS: {
      const previewStyle = {
        ...state.previewStyle,
        ...action.payload.previewStyle,
      };
      return { ...state, previewStyle };
    }
    case types.SAVE_CAPTIONS_SETTINGS: {
      const { modal } = action.payload;
      const playerStyle = {
        ...state.previewStyle,
      };
      return {
        ...state,
        playerStyle,
        modal,
        isSettingsOpen: false,
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

export function launchCaptionsModal(
  modal: videojs.ModalDialog
): CaptionsAction {
  // Pass whichever instance of the player is defined
  const regularPlayer = videojs.getPlayer(elements.player);
  const livePlayer = videojs.getPlayer(elements.livePlayer);

  const payload = livePlayer
    ? { livePlayer, modal }
    : regularPlayer
    ? { player: regularPlayer, modal }
    : { modal };

  return {
    type: types.LAUNCH_CAPTIONS_MODAL as CaptionsAction['type'],
    payload,
  };
}
export function openCaptionsSettings(
  modal: videojs.ModalDialog
): CaptionsAction {
  const payload = { modal };
  return {
    type: types.OPEN_CAPTIONS_SETTINGS as CaptionsAction['type'],
    payload,
  };
}

export function closeCaptionsSettings(
  modal: videojs.ModalDialog
): CaptionsAction {
  const payload = { modal };
  return {
    type: types.CLOSE_CAPTIONS_SETTINGS as CaptionsAction['type'],
    payload,
  };
}

export function saveCaptionsSettings(
  modal: videojs.ModalDialog
): CaptionsAction {
  const payload = { modal };
  return {
    type: types.SAVE_CAPTIONS_SETTINGS as CaptionsAction['type'],
    payload,
  };
}

export function changeCaptionsSettings(
  newStyles: Partial<CaptionsStyleVideoJs>
): CaptionsAction {
  const payload = { previewStyle: newStyles };
  return {
    type: types.CHANGE_CAPTIONS_SETTINGS as CaptionsAction['type'],
    payload,
  };
}

export function resetCaptionsSettings(): CaptionsAction {
  return changeCaptionsSettings(initialState.previewStyle);
}

export function addTextTrack(
  track: TextTrack,
  closedCaptionsButton: videojs.Component
): CaptionsAction {
  const payload = { track, closedCaptionsButton };
  return {
    type: types.ADD_TEXT_TRACK as CaptionsAction['type'],
    payload,
  };
}

export function changeCurrentTextTrack(
  closedCaptionsButton: videojs.Component,
  isSafari: boolean
): CaptionsAction {
  const payload = { closedCaptionsButton, isSafari };
  return {
    type: types.CHANGE_CURRENT_TEXT_TRACK as CaptionsAction['type'],
    payload,
  };
}

// Used only on Legacy Sidecar Captions button for DRM and MP4-only assets
export function addSidecarCaption(
  trackLanguage: string,
  closedCaptionsButton: videojs.Component
): CaptionsAction {
  const payload = { trackLanguage, closedCaptionsButton };
  return {
    type: types.ADD_SIDECAR_CAPTION as CaptionsAction['type'],
    payload,
  };
}

/**
 * ----------------------
 * Redux observable epics
 * ----------------------
 */

// ------------------------------------------------------------
// Closed Captions Settings modal
// ------------------------------------------------------------

export function captionsButtonEpic(
  action$: ActionsObservable<CaptionsAction>
): Observable<unknown> {
  return action$.pipe(
    ofType(types.LAUNCH_CAPTIONS_MODAL as CaptionsActionType),
    mergeMap((action) => {
      let playerComponent;
      const { player, livePlayer, modal } = action.payload;
      if (livePlayer) {
        playerComponent = livePlayer;
      } else if (player) {
        playerComponent = player;
      }

      return new Observable((observer) => {
        modal && observer.next(openCaptionsSettings(modal));
        playerComponent.textTrackSettings.restoreSettings();
        playerComponent.textTrackDisplay.updateDisplay();
      });
    })
  );
}

export function openCaptionsSettingsModal(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.OPEN_CAPTIONS_SETTINGS as CaptionsActionType),
    tap((action) => {
      let playerComponent;
      const { player, livePlayer, modal } = action.payload;
      if (livePlayer) {
        playerComponent = livePlayer;
      } else if (player) {
        playerComponent = player;
      }
      // emit a postMessage to let the parent portal know to hide the info overlay
      playerComponent.trigger('closedCaptionsSettingsOpen');

      modal && modal.open();
    }),
    ignoreElements()
  );
}

export function closeCaptionsSettingsModal(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(
      types.CLOSE_CAPTIONS_SETTINGS as CaptionsActionType,
      types.SAVE_CAPTIONS_SETTINGS as CaptionsActionType
    ),
    tap((action) => {
      let playerComponent;
      const { player, livePlayer, modal } = action.payload;
      if (livePlayer) {
        playerComponent = livePlayer;
      } else if (player) {
        playerComponent = player;
      }

      modal && modal.close();

      // emit a postMessage to let the parent portal know to show the info overlay
      playerComponent.trigger('closedCaptionsSettingsClosed');

    }),
    ignoreElements()
  );
}

export function pauseCaptionsEpic(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.OPEN_CAPTIONS_SETTINGS as CaptionsActionType),
    tap((action) => {
      const { player, livePlayer } = action.payload;
      const playerInstance = player ? player : livePlayer;
      if (playerInstance && !playerInstance.paused()) {
        playerInstance.pause();
      }
    }),
    ignoreElements()
  );
}

export const savedSettingsEpic = (
  action$: ActionsObservable<CaptionsAction>,
  state$: StateObservable<GlobalState>
): Observable<Response> => {
  return action$.pipe(
    ofType(types.SAVE_CAPTIONS_SETTINGS as CaptionsActionType),
    tap((action) => {
      let playerComponent;
      const { player, livePlayer } = action.payload;
      if (livePlayer) {
        playerComponent = videojs.getPlayer(elements.livePlayer);
      } else if (player) {
        playerComponent = videojs.getPlayer(elements.player);
      } else {
        return;
      }

      const captionsState: CaptionsStateVideoJs = state$.value.captions;
      // We need to drop the 'modal' part of the state object or else we will
      // hit 'cyclic object' errors when trying to save to local storage.
      if (captionsState.modal) delete captionsState.modal;

      const playerStyle: CaptionsStyleVideoJs = captionsState.playerStyle;

      //Workaround for: https://github.com/videojs/video.js/issues/6143
      playerComponent.textTrackSettings.setDefaults();

      // VideoJS needs fontPercent to be persisted as a Number instead of string
      playerStyle.fontPercent = Number(playerStyle.fontPercent);
      playerComponent.textTrackSettings.setValues(playerStyle);
      playerComponent.textTrackSettings.saveSettings();
      playerComponent.textTrackDisplay.updateDisplay();

      // Persist caption state to localStorage
      saveState(CAPTIONS_LOCAL_STORAGE_KEY, captionsState);
    }),
    ignoreElements()
  );
};

// ------------------------------------------------------------
// Closed Captions controlbar button
// ------------------------------------------------------------

// Toggles the closed captions button icon based on the menu item selected.
export function toggleCaptionsButtonIcon(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.CHANGE_CURRENT_TEXT_TRACK as CaptionsActionType),

    tap((action) => {
      const { player, livePlayer, closedCaptionsButton } = action.payload;
      const playerComponent = player || livePlayer;

      if (playerComponent) {
        const textTracks: TextTrack[] = filterTextTrackList(
          playerComponent.textTracks()
        );

        // "Off" ---- use the outline icon
        if (textTracks.every((track: TextTrack) => track.mode === 'disabled')) {
          closedCaptionsButton && toggleButtonOff(closedCaptionsButton);
        } else {
          // Something is toggled on -- show the filled in icon
          closedCaptionsButton && toggleButtonOn(closedCaptionsButton);
        }
      }
    }),
    ignoreElements()
  );
}

// ------------------------------------------------------------
// Closed Captions visibility (local storage)
// ------------------------------------------------------------

// Restore text track modes from local storage - VOD and Live Player
// This epic logic runs whenever a caption is parsed from the manifest.
export function restoreCaptionsSelectionEpic(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.ADD_TEXT_TRACK as CaptionsActionType),
    tap((action) => {
      const { player, livePlayer, track, closedCaptionsButton } =
        action.payload;

      const playerComponent = player || livePlayer;

      const button: videojs.Component | undefined =
        closedCaptionsButton as videojs.TextTrackButton;

      if (playerComponent) {
        const captionLabel: string = loadState(CAPTIONS_SELECTION_KEY);
        const playerTextTracks: TextTrackList = playerComponent.textTracks();

        // ---------------
        // handle multiple languages
        const trackLanguage = track?.language || '';
        const translatedName = getNativeName(trackLanguage);

        if (captionLabel === translatedName) {
          for (let i = 0; i < playerTextTracks.length; i++) {
            const playerTextTrack: TextTrack = playerTextTracks[i];
            const playerTextTrackLabel = getNativeName(
              playerTextTrack.language
            );

            // disable all tracks before setting anything to showing
            playerTextTrack.mode = 'disabled';
            // toggle the button "off"
            closedCaptionsButton && toggleButtonOff(closedCaptionsButton);

            if (playerTextTrackLabel === translatedName) {
              playerTextTrack.mode = 'showing';
              // toggle the button "on"
              closedCaptionsButton && toggleButtonOn(closedCaptionsButton);
            }
          }
          // update the button with the current state of its items
          //@ts-ignore
          button && button.update();
        }
      }
    }),
    ignoreElements()
  );
}

export function restoreSidecarCaptionsSelectionEpic(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.ADD_SIDECAR_CAPTION as CaptionsActionType),
    tap((action) => {
      const { player, trackLanguage, closedCaptionsButton } = action.payload;

      if (player && closedCaptionsButton) {
        const captionLabel: string = loadState(CAPTIONS_SELECTION_KEY);
        const playerTextTracks: TextTrackList = getTextTracks(player);

        // filter out anything that isn't 'captions'
        const filteredTextTracks: TextTrack[] = [];
        for (let i = 0; i < playerTextTracks.length; i++) {
          if (playerTextTracks[i].kind === 'captions')
            filteredTextTracks.push(playerTextTracks[i]);
        }

        // handle single or multiple languages
        const languageOptions: string[] = filteredTextTracks.map(
          (textTrack: TextTrack) => getNativeName(textTrack.language)
        );

        const addedTrackLanguage = trackLanguage || '';
        const translatedName = getNativeName(addedTrackLanguage);

        if (captionLabel === translatedName) {
          for (let i = 0; i < filteredTextTracks.length; i++) {
            const playerTextTrack: TextTrack = filteredTextTracks[i];

            const playerTextTrackLabel = getNativeName(
              playerTextTrack.language
            );

            // disable all tracks before setting anything to showing
            playerTextTrack.mode = 'disabled';

            if (
              playerTextTrackLabel === translatedName &&
              playerTextTrack.kind === 'captions'
            ) {
              // Wait a second to avoid race conditions
              setTimeout(() => {
                playerTextTrack.mode = 'showing';
                // select the appropriate menu item
                selectItemByLabel(closedCaptionsButton, captionLabel);
              }, 200);

              // toggle the button "on"
              toggleButtonOn(closedCaptionsButton);
            }
          }
        } else if (
          captionLabel === 'Off' ||
          captionLabel === undefined ||
          !languageOptions.includes(captionLabel)
        ) {
          deselectAllItems(closedCaptionsButton);
          // toggle the button "off"
          toggleButtonOff(closedCaptionsButton);
          // select the 'off' menu item
          selectItemByLabel(closedCaptionsButton, 'Off');
        }
      }
    }),
    ignoreElements()
  );
}

// When the user changes text tracks, find the track that is showing and save its label to localStorage - VOD and LivePlayer
export function saveCaptionsSelectionEpic(
  action$: ActionsObservable<CaptionsAction>
): Observable<Response> {
  return action$.pipe(
    ofType(types.CHANGE_CURRENT_TEXT_TRACK as CaptionsActionType),
    tap((action) => {
      const { player, livePlayer, isSafari } = action.payload;
      const playerComponent = player || livePlayer;

      if (playerComponent) {
        const tracks: TextTrackList = playerComponent.textTracks();
        const parsedTextTracks: TextTrack[] = filterTextTrackList(tracks);

        // VideoJS doesn't maintain an "Off" text track, so we need to detect that all captions and subtitles
        // are 'disabled' to determine if we should save "Off".
        if (
          parsedTextTracks.every(
            (track: TextTrack) => track.mode === 'disabled'
          )
        ) {
          !isSafari && saveState(CAPTIONS_SELECTION_KEY, 'Off');
        } else {
          const captionsShowing: TextTrack[] = parsedTextTracks.filter(
            (track: TextTrack) => track.mode === 'showing'
          );
          if (captionsShowing && captionsShowing.length > 0) {
            const captionToggledOn: TextTrack = captionsShowing[0];
            const translatedLanguageName: string = getNativeName(
              captionToggledOn.language
            );

            !isSafari &&
              saveState(CAPTIONS_SELECTION_KEY, translatedLanguageName);
          }
        }
      }
    }),
    ignoreElements()
  );
}

export const captionsEpic = combineEpics(
  captionsButtonEpic,
  pauseCaptionsEpic,
  savedSettingsEpic,
  openCaptionsSettingsModal,
  closeCaptionsSettingsModal,
  toggleCaptionsButtonIcon,
  saveCaptionsSelectionEpic,
  restoreCaptionsSelectionEpic,
  restoreSidecarCaptionsSelectionEpic
);
