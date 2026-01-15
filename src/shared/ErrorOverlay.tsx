import * as React from 'react';
import Overlay from '../player/overlay';
import ErrorMessage, { getErrorMessage } from '../player/error-message';
import { UrsData } from '../lib/urs';

type ErrorOverlayProps = {
  errorData?: UrsData;
};

export const ErrorOverlay: React.FC<ErrorOverlayProps> = (props) => {
  const { errorData } = props;

  return (
    <Overlay>
      <ErrorMessage message={getErrorMessage(errorData)} />
    </Overlay>
  );
};
