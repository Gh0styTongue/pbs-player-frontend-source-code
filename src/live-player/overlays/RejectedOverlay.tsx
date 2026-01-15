import * as React from 'react';
import Overlay from '../../player/overlay';
import { urls } from '../../constants';

type RejectedOverlayProps = {
  stationCommonName: string;
};

export const RejectedOverlay: React.FC<RejectedOverlayProps> = (props) => {
  const { stationCommonName } = props;

  return (
    <Overlay>
      <div className="location-request livestream-rejected">
        <div className="location-request__message">
          <div className="location-request__message-header message-unavailable">
            Traveling? The {stationCommonName} livestream is currently not
            available.
          </div>
          <div className="location-request__message-coverage">
            <p>
              It looks like you&rsquo;re outside of the {stationCommonName} broadcast area.
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
