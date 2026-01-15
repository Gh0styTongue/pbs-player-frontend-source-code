import * as React from 'react';

import './clickable.scss';

interface ClickableProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function Clickable(props: ClickableProps): JSX.Element {
  return (
    <button
      className="clickable"
      aria-label={props.label}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export default Clickable;
