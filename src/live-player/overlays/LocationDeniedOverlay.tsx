import * as React from 'react';
import Overlay from '../../player/overlay';
import { urls } from '../../constants';

export const LocationDeniedOverlay: React.FC = () => {
  return (
    <Overlay>
      <div className="location-request livestream-rejected">
        <div className="location-request__message">
          <div className="location-request__message-header message-unavailable">
            We could not determine your device’s location.
          </div>
          <div className="location-request__message-coverage">
            <p>
              You may need to allow location when prompted.
              <br />
              If you do not see a prompt, you may need to enable location
              services on your device or browser.
            </p>
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
