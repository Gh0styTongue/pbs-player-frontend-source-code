import * as React from 'react';
import classNames from 'classnames';

import { Video, Context } from '../../bridge';
import { getVideoShareUrl } from '../../lib/pbs';
import FacebookIcon from './facebook-icon';
import TwitterIcon from './twitter-icon';
import EmailIcon from './email-icon';
import LinkIcon from './link-icon';

import './share-screen.scss';

export function getFacebookShareLink(video: Video, context: Context): string {
  const videoUrl = getVideoShareUrl(video, context);
  const shareLink = encodeURIComponent(videoUrl);
  return `https://www.facebook.com/sharer.php?u=${shareLink}`;
}

export function getTwitterShareLink(video: Video, context: Context): string {
  const title = encodeURIComponent(video.title);
  const videoUrl = getVideoShareUrl(video, context);
  const shareLink = encodeURIComponent(videoUrl);
  return `http://twitter.com/share?text=${title}&url=${shareLink}`;
}

export function getEmailShareLink(video: Video, context: Context): string {
  const videoUrl = getVideoShareUrl(video, context);
  const shareLink = encodeURIComponent(videoUrl);
  return `mailto:?body=I thought you might like this: ${shareLink}`;
}

export const WEB_WINDOW_FEATURES = [
  'width=420',
  'height=320',
  'location=0',
  'menubar=0',
  'scrollbars=0',
  'status=1',
  'resizable=0',
].join(',');

interface ShareScreenProps {
  video: Video;
  context: Context;
  handleClose: () => void;
}

function ShareScreen({ video, context, handleClose }: ShareScreenProps): JSX.Element {
  const [showDirectLink, setShowDirectLink] = React.useState(false);

  const toggleDirectLinkField = () => {
    setShowDirectLink((prev) => !prev);
  };

  const windowName = ''; // open a new window
  const emailWindowName = 'emailWindow';
  const directLinkFieldClasses = classNames({
    'share-screen__direct-link-field': true,
    hidden: !showDirectLink,
  });

  return (
    <div className="share-screen">
      <div className="share-screen__header">
        <div className="share-screen__heading">Share This Video</div>
        <button
          className="share-screen__close topbar__close-btn"
          onClick={handleClose}
        >
          Return to Video
        </button>
      </div>

      <div className="share-screen__links">
        <div className="share-screen__option">
          <button
            className="share-screen__button"
            onClick={() =>
              window.open(
                getFacebookShareLink(video, context),
                windowName,
                WEB_WINDOW_FEATURES
              )
            }
          >
            <FacebookIcon />
            <p className="share-screen__button-label">facebook</p>
          </button>
        </div>
        <div className="share-screen__option">
          <button
            className="share-screen__button"
            onClick={() =>
              window.open(
                getTwitterShareLink(video, context),
                windowName,
                WEB_WINDOW_FEATURES
              )
            }
          >
            <TwitterIcon />
            <p className="share-screen__button-label">twitter</p>
          </button>
        </div>
        <div className="share-screen__option">
          <button
            className="share-screen__button"
            onClick={() =>
              window.open(getEmailShareLink(video, context), emailWindowName)
            }
          >
            <EmailIcon />
            <p className="share-screen__button-label">email</p>
          </button>
        </div>
        <div className="share-screen__option">
          <button
            className="share-screen__button"
            onClick={toggleDirectLinkField}
          >
            <LinkIcon />
            <p className="share-screen__button-label">link</p>
          </button>
          <div className={directLinkFieldClasses}>
            <input type="text" value={getVideoShareUrl(video, context)} aria-label="Direct link to video" readOnly />
            <p>Please copy this text to your clipboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareScreen;
