
import classNames from 'classnames';

import './circular-progress.scss';

interface CircularProgressProps {
  className?: string;
  radius: number;
  progress: number;
  iconColor: string;
  stroke: number;
  strokeColor: string;
  trailColor: string;
  trailOpacity?: number;
  opacity?: number;
}

function CircularProgress(props: CircularProgressProps): JSX.Element {
  // Implementation taken liberally from CssTricks
  // https://css-tricks.com/building-progress-ring-quickly/

  const {
    className,
    radius,
    progress,
    iconColor,
    stroke,
    strokeColor,
    trailColor,
    trailOpacity,
    opacity,
  } = props;
  const calculatedProgress = Math.ceil(progress);

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = -1 * (calculatedProgress / 100) * circumference;

  const trianglePoints = [
    // top left
    [radius * 0.85, radius * 0.75],
    // bottom left
    [radius * 0.85, radius + radius * 0.25],
    // right
    [radius + radius * 0.25, radius],
  ];
  const formattedPairs = trianglePoints.map((pair) => pair.join(','));
  const formattedPoints = formattedPairs.join(' ');

  return (
    <div className={classNames('circular-progress', className)}>
      <svg height={radius * 2} width={radius * 2}>
        <polygon
          className="circular-progress-play"
          points={formattedPoints}
          strokeLinejoin="round"
          stroke={iconColor}
          fill={iconColor}
          strokeWidth="1"
        />

        <g opacity={opacity}>
          <circle
            className="circular-progress-trail"
            stroke={trailColor}
            fill="transparent"
            opacity={trailOpacity || 1}
            strokeWidth={stroke}
            strokeOpacity={1}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          <circle
            className="circular-progress-main"
            stroke={strokeColor}
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            fill="transparent"
            strokeWidth={stroke}
            strokeOpacity={1}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </g>
      </svg>
    </div>
  );
}

export default CircularProgress;
