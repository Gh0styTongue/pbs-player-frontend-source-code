import * as React from 'react';
import { urls } from '../../constants';
import Overlay from '../../player/overlay';
import { LocationRequestButton } from './LocationRequestButton';

type LocationTimedOutOverlayProps = {
  checkGeolocation: () => void;
  livestreamAvailability: string;
};

export const LocationTimedOutOverlay: React.FC<LocationTimedOutOverlayProps> = (
  props
) => {
  const { checkGeolocation, livestreamAvailability } = props;

  return (
    <Overlay>
      <div className="location-request livestream-rejected">
        <div className="location-request__message">
          <div className="location-request__message-header message-unavailable">
            Something went wrong while getting your device’s location.
          </div>
          <div className="location-request__message-action">
            <LocationRequestButton
              text="Try Again"
              onclick={checkGeolocation}
              livestreamAvailability={livestreamAvailability}
            />
          </div>
          <div className="location-request__message-more-information">
            <p>
              For more information, visit our{' '}
              <a
                href={urls.livestreamHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Livestreaming Help"
              >
                livestreaming FAQ
              </a>{' '}
              .
            </p>
          </div>
        </div>
      </div>
    </Overlay>
  );
};
