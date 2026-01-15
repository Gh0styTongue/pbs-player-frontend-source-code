import * as React from 'react';

type PosterOverlayProps = {
  stationCommonName: string;
  stationLogo: string;
};

export const PosterOverlay: React.FC<PosterOverlayProps> = (props) => {
  const { stationCommonName, stationLogo } = props;

  return (
    <>
      <div className="liveplayer-poster-overlay">
        <img
          className="liveplayer-poster-overlay--logo"
          src={stationLogo}
          alt={`${stationCommonName} logo`}
        />

        <p className="liveplayer-poster-overlay--watch-live-text">
          <span className="liveplayer-poster-overlay--watch-live-indicator">
            •
          </span>{' '}
          Watch Live TV
        </p>
      </div>
    </>
  );
};
