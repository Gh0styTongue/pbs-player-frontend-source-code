import videojs from 'video.js';
import { loadState } from '../lib/local-storage';
import { filterTextTrackList } from './filter-text-track-list';
import { getNativeName } from '../lib/get-native-name';
import { CAPTIONS_SELECTION_KEY } from './store';
import { toggleButtonOff, toggleButtonOn } from './toggle-captions';

export const restoreCaptionsButtonFromLocalStorage = (
  closedCaptionsButton: videojs.Component,
  tracks: TextTrackList
): void => {
  // load the user preference from local storage
  const captionLabel: string = loadState(CAPTIONS_SELECTION_KEY);

  // Get the translated, manifest-parsed text track labels
  const textTracks: TextTrack[] = filterTextTrackList(tracks);
  const textTrackOptions: string[] = textTracks.map((textTrack: TextTrack) =>
    getNativeName(textTrack.language)
  );

  // In the event that a user has a saved caption preference for a language that is not
  // available on the current asset/stream, the button should appear 'off'.
  if (
    captionLabel === 'Off' ||
    captionLabel === undefined ||
    !textTrackOptions.includes(captionLabel)
  ) {
    toggleButtonOff(closedCaptionsButton);
  } else {
    toggleButtonOn(closedCaptionsButton);
  }
};
