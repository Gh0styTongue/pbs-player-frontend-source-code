/*
  <LoadingIndicator />
  Loading animation is handled in CSS - see index.scss
*/



import './loading-indicator.scss';


interface LoadingIndicatorProps {
  addClass?: string;
}

export const LoadingIndicator = (props: LoadingIndicatorProps): JSX.Element => {
  let classNames = 'loading-indicator';
  const { addClass } = props;

  if (addClass) {
    classNames += ` ${addClass}`;
  }

  return (
    <div className={classNames} data-testid="loading-indicator">
      <div className="loading-indicator__spinner">
        <div className="loading-indicator__spinner bounce1"></div>
        <div className="loading-indicator__spinner bounce2"></div>
        <div className="loading-indicator__spinner bounce3"></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
