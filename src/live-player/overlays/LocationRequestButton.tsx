import * as React from 'react';
import LoadingIndicator from '../../shared/loading-indicator';

type LocationRequestButtonProps = {
  onclick: () => void;
  livestreamAvailability: string;
  text: string;
};

export const LocationRequestButton: React.FC<LocationRequestButtonProps> = (
  props
) => {
  const { onclick, livestreamAvailability, text } = props;

  return (
    <button
      className="btn btn--fill--white"
      onClick={() => {
        onclick();
      }}
    >
      {livestreamAvailability === 'evaluating' ? <LoadingIndicator /> : text}
    </button>
  );
};
