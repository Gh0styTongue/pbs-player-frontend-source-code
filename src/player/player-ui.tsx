import { connect } from 'react-redux';
import videojs from 'video.js';
import { Video, Context } from '../bridge';
import { GlobalState } from '../store';

import { ModalPortal } from '../shared/modal-dialog';
import Overlay from './overlay';
import ClosedCaptionsSettings from '../captions/settings-modal';
import InfoOverlay from '../topbar/info-overlay';
import TopBarScreen from '../topbar/topbar-screen';
import EndScreen from '../endscreen/end-screen';
import ContinuousPlayOverlay from '../continuous-play/continuous-play';
import { elements } from '../constants';
import { Dispatch } from 'redux';
import { VideoJsPBSPlayer } from './player';

interface PlayerUIProps {
  video: Video;
  context: Context;
  store: unknown;
  dispatch: Dispatch;
  isCaptionsOpen: boolean;
  isTopBarScreenOpen: boolean;
  isStatusBarOpen: boolean;
  isVideoComplete: boolean;
  isPlayerPaused: boolean;
}

function mapStateToProps(state: GlobalState): Partial<PlayerUIProps> {
  return {
    isCaptionsOpen: state.captions.isSettingsOpen,
    isTopBarScreenOpen: state.topBar.screen !== 'CLOSED',
    isStatusBarOpen: state.player.playback === 'READY',
    isVideoComplete: state.player.playback === 'COMPLETE',
    isPlayerPaused: state.player.playback === 'PAUSED',
  };
}

/**
 * Provides all of the various player UI components to the main root Player component.
 */
export function PlayerUI(props: PlayerUIProps): JSX.Element {
  const {
    video,
    context,
    isCaptionsOpen,
    isTopBarScreenOpen,
    isStatusBarOpen,
    isPlayerPaused,
    isVideoComplete,
  } = props;

  const player: VideoJsPBSPlayer = videojs.getPlayer(elements.player) as VideoJsPBSPlayer;

  const modalContainer = document.getElementById(
    'closed-captions-settings-modal-dialog'
  );
  // This is the info overlay that should only appear on the Viral player on initial load.
  const showInfoOverlay =
    context.playerType === 'viral_player' && isStatusBarOpen;
  // This is the pause overlay that should only appear on the Viral player when paused. It shows bits of helpful metadata.
  const showPauseOverlay =
    context.playerType === 'viral_player' && isPlayerPaused;

  // if the player URL contains "unsafeDisableContinuousPlay=true", disable continuous play
  // no ui, no countdown, no call to content services
  const showContinuousPlay: boolean =
    (context.playerType === 'portal_player' ||
      context.playerType === 'station_player') &&
    !context.options.unsafeDisableContinuousPlay;

  //We don't render the Overlay component when the EndScreen component would return null. This fixes PLYR-260 where the overlay was blocking user interaction with the layers beneath it.
  const showEndScreen: boolean =
    !showContinuousPlay &&
    isVideoComplete &&
    context.options.endscreen &&
    !isTopBarScreenOpen;

  // helps with instances where portal/station players were blocking users from clicking on the replay icon upon video completion.
  const showReplay: boolean =
    (context.playerType === 'portal_player' ||
      context.playerType === 'station_player') &&
    context.options.unsafeDisableContinuousPlay &&
    isVideoComplete;

  return (
    <>
      {showInfoOverlay ? <InfoOverlay video={video} /> : null}

      {showPauseOverlay ? <InfoOverlay video={video} /> : null}

      {isTopBarScreenOpen ? (
        <Overlay>
          <TopBarScreen player={player} video={video} context={context} />
        </Overlay>
      ) : null}

      {isCaptionsOpen ? (
        modalContainer ? (
          <ModalPortal modalContainer={modalContainer}>
            <Overlay>
              <ClosedCaptionsSettings video={video} player={player} />
            </Overlay>
          </ModalPortal>
        ) : null
      ) : null}

      {showEndScreen ? (
        <Overlay showControls showReplay={showReplay}>
          <EndScreen
            video={video}
            context={context}
            isOpen={isVideoComplete}
            player={player}
          />
        </Overlay>
      ) : null}

      {showContinuousPlay ? <ContinuousPlayOverlay video={video} context={context} /> : null}
    </>
  );
}

const PlayerUIContainer = connect(mapStateToProps)(PlayerUI);

export default PlayerUIContainer;
