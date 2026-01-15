import * as React from 'react';
import Overlay from '../../player/overlay';
import LoadingIndicator from '../../shared/loading-indicator';

export const LoadingOverlay: React.FC = () => {
  return (
    <Overlay>
      <div className="livestream-loading-spinner">
        <LoadingIndicator />
      </div>
    </Overlay>
  );
};
