import * as React from 'react';
import { connect } from 'react-redux';

import './live-player-ui.scss';
import { LivePlayerContext, LivestreamAvailability } from '../bridge';
import { GlobalState } from '../store';
import { RejectedOverlay } from './overlays/RejectedOverlay';
import { LocationDeniedOverlay } from './overlays/LocationDeniedOverlay';
import { LocationTimedOutOverlay } from './overlays/LocationTimedOutOverlay';
import { LocationRequestOverlay } from './overlays/LocationRequestOverlay';
import { LoadingOverlay } from './overlays/LoadingOverlay';
import { CaptionsOverlay } from './overlays/CaptionsOverlay';
import { ModalPortal } from '../shared/modal-dialog';

type LivePlayerUIProps = {
  livestreamAvailability: LivestreamAvailability;
  context: LivePlayerContext;
  checkGeolocation: () => void;
  isCaptionsOpen?: boolean;
};

function mapStateToProps(state: GlobalState): Partial<LivePlayerUIProps> {
  return {
    isCaptionsOpen: state.captions.isSettingsOpen,
  };
}

/*
 * This component just handles the air traffic control of which overlay to display
 */
export const LivePlayerUI: React.FC<LivePlayerUIProps> = (props) => {
  const { livestreamAvailability, context, checkGeolocation, isCaptionsOpen } =
    props;

  if (livestreamAvailability === 'evaluating') {
    return <LoadingOverlay />;
  }

  // overlay if the user is outside the area
  if (livestreamAvailability === 'rejected') {
    return <RejectedOverlay stationCommonName={context.stationCommonName} />;
  }

  // overlay if the user has denied location either in the browser or in their OS
  if (livestreamAvailability === 'locationDenied') {
    return <LocationDeniedOverlay />;
  }

  // overlay if there was a timeout determening the user's location
  if (livestreamAvailability === 'locationTimedOut') {
    return (
      <LocationTimedOutOverlay
        checkGeolocation={checkGeolocation}
        livestreamAvailability={livestreamAvailability}
      />
    );
  }

  if (isCaptionsOpen) {
    const modalContainer = document.getElementById(
      'closed-captions-settings-modal-dialog'
    );

    if (modalContainer) {
      return (
        <ModalPortal modalContainer={modalContainer}>
          <CaptionsOverlay />
        </ModalPortal>
      );
    }
  }

  if (livestreamAvailability === 'locationNeeded') {
    return (
      <LocationRequestOverlay
        checkGeolocation={checkGeolocation}
        livestreamAvailability={livestreamAvailability}
      />
    );
  }

  return null;
};

export const LivePlayerUIContainer = connect(mapStateToProps)(LivePlayerUI);
