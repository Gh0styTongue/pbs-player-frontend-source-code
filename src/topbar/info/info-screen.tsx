

import { Video } from '../../bridge';
import CCIcon from './cc-icon';

import './info-screen.scss';

interface InfoScreenProps {
  video: Video;
  handleClose: () => void;
}

export function getShowTitle(video: Video): string {
  return (video.program && video.program.title) || 'pbs';
}

export function getShowLink(video: Video): JSX.Element {
  const showSlug = video.program && video.program.slug;
  const showTitle = getShowTitle(video);

  const url = showSlug
    ? `https://www.pbs.org/show/${showSlug}`
    : 'https://www.pbs.org';

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {showTitle}
    </a>
  );
}

function InfoScreen(props: InfoScreenProps): JSX.Element {
  const { video, handleClose } = props;

  return (
    <div className="info-screen">
      <div className="info-screen__header">
        <div className="info-screen__cc-issue">
          <a
            href="https://www.pbs.org/cc-info/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Problems with CC?
          </a>
        </div>
        <button
          className="info-screen__close topbar__close-btn"
          onClick={() => handleClose()}
        >
          Return to Video
        </button>
      </div>

      <div className="info-screen__title">
        <p className="info-screen__show-title">{getShowLink(video)}</p>
        <p className="info-screen__video-title">{video.title}</p>
      </div>

      <div className="info-screen__detail">
        <p className="info-screen__description">{video.longDescription}</p>

        {video.airDateFormatted ? (
          <p className="info-screen__meta">
            <span className="info-screen__premiere">
              Premiere Date: {video.airDateFormatted}
            </span>
            <CCIcon />
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default InfoScreen;
