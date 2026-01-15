/**
 * This function filters out text tracks that aren't subtitles or captions.
 **/
export const filterTextTrackList = (
  textTrackList: TextTrackList
): TextTrack[] => {
  const subtitlesAndCaptions: TextTrack[] = [];
  if (textTrackList) {
    for (let i = 0; i < textTrackList.length; i++) {
      const track: TextTrack = textTrackList[i];
      if (['subtitles', 'captions'].includes(track.kind)) {
        subtitlesAndCaptions.push(track);
      }
    }
  }
  return subtitlesAndCaptions;
};
