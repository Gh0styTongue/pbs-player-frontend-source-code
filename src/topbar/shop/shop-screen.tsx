
import { Video } from '../../bridge';
import './shop-screen.scss';

import * as ShopPBSLogo from './shop-pbs.svg';

interface ShopScreenProps {
  video: Video;
  handleClose: () => void;
}

function ShopScreen(props: ShopScreenProps): JSX.Element {
  const { video, handleClose } = props;

  return (
    <div className="shop-screen">
      <div className="shop-screen__header">
        <div className="shop-screen__heading">Buy It</div>
        <button
          className="shop-screen__close topbar__close-btn"
          onClick={() => handleClose()}
        >
          Return to Video
        </button>
      </div>

      <div>
        <img className="shop-screen__logo" src={ShopPBSLogo.default} alt="Shop PBS" />
        <p className="shop-screen__message">
          Your purchase helps support PBS and the programs you love.
        </p>
      </div>

      <div className="shop-screen__cta">
        {video.itunesLink ? (
          <button
            className="btn btn--fill--blue"
            onClick={() => window.open(video.itunesLink)}
          >
            Buy on iTunes
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ShopScreen;
