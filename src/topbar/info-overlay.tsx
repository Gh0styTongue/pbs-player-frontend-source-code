

import { Video } from '../bridge';
import { formatDurationPretty } from '../lib/time';

import './info-overlay.scss';

// Currently only used on the Viral Player
interface InfoOverlayProps {
  video: Video;
}

export function getShowLink(video: Video): JSX.Element {
  const showSlug = video.program && video.program.slug;
  const showTitle = (video.program && video.program.title) || 'PBS';
  const url = showSlug
    ? `https://www.pbs.org/show/${showSlug}`
    : 'https://www.pbs.org';

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {showTitle}
    </a>
  );
}

export function InfoOverlay(props: InfoOverlayProps): JSX.Element {
  const { video } = props;

  return (
    <div className="info-overlay">
      <div className="info-overlay__header">
        <p className="info-overlay__show">{getShowLink(video)}</p>
        <h2 className="info-overlay__title">{video.title}</h2>
      </div>
      <div className="info-overlay__details">
        {video.seriesInfo} | {formatDurationPretty(video.duration)}
      </div>
    </div>
  );
}

export default InfoOverlay;
