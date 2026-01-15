import * as React from 'react';
import classNames from 'classnames';

import './overlay.scss';

interface PlayerOverlayProps {
  children: React.ReactNode;
  showControls?: boolean;
  showReplay?: boolean;
}

export function PlayerOverlay(props: PlayerOverlayProps): JSX.Element {
  return (
    <div
      className={classNames({
        'player-overlay': true,
        'player-overlay--show-controls': !!props.showControls,
        'player-overlay--show-replay': !!props.showReplay,
      })}
    >
      <div className="player-overlay__inner">{props.children}</div>
    </div>
  );
}

export default PlayerOverlay;
