import { VideoJsPBSPlayer } from './player';

// this function gets dash-specific quality data, initializes our custom quality button, and fills those item slots with representations (dash quality levels)
export const parseDashQualityLevels = (player: VideoJsPBSPlayer) => {
  const mediaPlayer = player.dash.mediaPlayer;
  // set the player's Dash-specific quality levels list
  player.dashQualityLevels = mediaPlayer.getBitrateInfoListFor('video');
  // now trigger the event that initializes the custom button and mounts it
  player.trigger('dashQualityLevels');

  player.on('dashQualityLevelsSelected', function (e, payload) {
    const { autoSwitchBitrate } = payload;

    const select: number = e.target.player.dashQualityLevelsSelected;
    const cfg = {
      streaming: {
        abr: {
          autoSwitchBitrate: {},
        },
      },
    };

    cfg.streaming.abr.autoSwitchBitrate['video'] = autoSwitchBitrate;
    mediaPlayer.updateSettings(cfg);
    mediaPlayer.setQualityFor('video', select, true);
  });
};
