import * as React from 'react';
import { locationRequest } from '../../constants';
import Overlay from '../../player/overlay';
import { LocationRequestButton } from './LocationRequestButton';

type LocationRequestOverlayProps = {
  checkGeolocation: () => void;
  livestreamAvailability: string;
};

export const LocationRequestOverlay: React.FC<LocationRequestOverlayProps> = (
  props
) => {
  const { checkGeolocation, livestreamAvailability } = props;

  return (
    <Overlay>
      <div className="location-request">
        <div className="location-request__message">
          <div className="location-request__message-header">
            {locationRequest.locationRequired.header}
          </div>
          <div className="location-request__message-details">
            <p>{locationRequest.locationRequired.message}</p>
          </div>
          <div className="location-request__message-action">
            <LocationRequestButton
              text="Start Watching"
              onclick={checkGeolocation}
              livestreamAvailability={livestreamAvailability}
            />
          </div>
        </div>
      </div>
    </Overlay>
  );
};
