

import CircularProgress from './circular-progress';
import * as PassportCornerBadge from './passport-compass-rose--corner.svg';

import './thumbnail-progress.scss';

interface ThumbnailProgressProps {
  progress: number;
  thumbnail: string;
  isPassport?: boolean;
}

function ThumbnailProgress(props: ThumbnailProgressProps): JSX.Element {
  const { progress, thumbnail, isPassport } = props;

  const radius = 40;
  const stroke = 8;

  return (
    <div
      className="thumbnail-progress"
      style={{ backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover' }}
    >
      {isPassport && (
        <img
          className="passport__corner-badge"
          src={PassportCornerBadge.default}
          alt="Passport"
        />
      )}
      <div className="thumbnail-progress-play">
        <div className="thumbnail-progress-play-inner">
          <CircularProgress
            className="thumbnail-progress-play-fg"
            radius={radius}
            stroke={stroke}
            progress={progress}
            iconColor="#fff"
            strokeColor="#fe704e"
            trailColor="#fff"
            trailOpacity={0.4}
            opacity={0.9}
          />
        </div>
      </div>
    </div>
  );
}

export default ThumbnailProgress;
