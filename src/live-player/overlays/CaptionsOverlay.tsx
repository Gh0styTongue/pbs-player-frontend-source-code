import * as React from 'react';
import Overlay from '../../player/overlay';
import ClosedCaptionsSettings from '../../captions/settings-modal';

export const CaptionsOverlay: React.FC = () => {
  return (
    <Overlay>
      <ClosedCaptionsSettings />
    </Overlay>
  );
};
