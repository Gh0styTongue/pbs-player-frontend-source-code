

import { errorMessages } from '../constants';
import { UrsData } from '../lib/urs';

import './error-message.scss';

export const getErrorMessage = (errorData?: UrsData): string => {
  const message: string = (errorData && errorData.message) || '';

  if (message.toLowerCase().includes('region')) {
    return errorMessages.regionRestriction;
  } else if (message.toLowerCase().includes('livestream')) {
    return errorMessages.livestreamError;
  } else {
    return errorMessages.defaults;
  }
};

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = (props: ErrorMessageProps): JSX.Element => {
  return (
    <div className="player-error">
      <div className="player-error__wrapper">
        <p className="player-error__message">{props.message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
