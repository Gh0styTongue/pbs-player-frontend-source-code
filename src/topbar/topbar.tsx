import * as React from 'react';
import { connect } from 'react-redux';
import { Context, Video } from '../bridge';
import { GlobalState } from '../store';
import EmbedIcon from './embed/embed-icon';
import InfoIcon from './info/info-icon';
import ShareIcon from './share/share-icon';
import ShopIcon from './shop/shop-icon';
import {
  openTopBarEmbedScreen,
  openTopBarInfoScreen,
  openTopBarShareScreen,
  openTopBarShopScreen,
  ScreenState,
  TopBarAction,
} from './store';
import * as TopbarPBSLogo from './topbar-pbs.png';
import './topbar.scss';

export function hideTopBar(): void {
  const topbarEl: HTMLElement | null = document.getElementById('topbar');
  if (topbarEl) {
    topbarEl.style.transform = 'translateY(-100%)';
  }
}

interface TopBarProps {
  context: Context;
  video: Video;
  dispatch: (arg0: TopBarAction) => void;
  screen: ScreenState;
  progress: number;
}

function mapStateToProps(state: GlobalState): Partial<TopBarProps> {
  return {
    screen: state.topBar.screen,
    progress: state.player.progress,
  };
}

export function TopBar(props: TopBarProps): JSX.Element | null {
  const { dispatch, video, context, screen, progress } = props;

  // topbarRef for imperative visibility toggling
  const topbarRef = React.createRef<HTMLDivElement>(); //mutable

  const renderLogo = context.playerType === 'viral_player';
  const hasBuyLink = video.itunesLink ? true : false;

  const showTopBar =
    context.playerType === 'viral_player' || context.options.topbar;
  if (!showTopBar) {
    return null;
  }

  // topbar on partner player should disappear during playback / not hovered and shouldn't leave an empty space
  const topBarContainerClass =
    context.playerType === 'partner_player' ||
    context.playerType === 'bento_player'
      ? 'topbar-container'
      : '';

  function onMouseEnterTopBar() {
    if (
      topbarRef &&
      topbarRef.current &&
      (context.playerType === 'partner_player' ||
        context.playerType === 'bento_player')
    ) {
      topbarRef.current.style.transform = 'translateY(0)';
    }
  }

  function onMouseLeaveTopBar(e) {
    // on the initial frame, before playback, don't trigger the hide animation
    if (
      (context.playerType === 'partner_player' ||
        context.playerType === 'bento_player') &&
      progress !== 0
    ) {
      e.target.style.transform = 'translateY(-100%)';
    }
  }

  return (
    <div
      className={`${topBarContainerClass}`}
      onMouseEnter={onMouseEnterTopBar}
    >
      <div
        id="topbar"
        className="topbar"
        ref={topbarRef}
        onMouseLeave={onMouseLeaveTopBar}
      >
        <div className="topbar__logo">
          {renderLogo ? (
            <h1>
              <a href="https://www.pbs.org">
                <img src={TopbarPBSLogo.default} alt="PBS Video" />
              </a>
            </h1>
          ) : null}
        </div>

        <div className="topbar__controls">
          <button
            className="topbar__screen-button"
            onClick={() => dispatch(openTopBarInfoScreen())}
          >
            <InfoIcon isSelected={screen === 'INFO'} />
          </button>

          {video.allowEmbed ? (
            <button
              className="topbar__screen-button"
              onClick={() => dispatch(openTopBarEmbedScreen())}
            >
              <EmbedIcon isSelected={screen === 'EMBED'} />
            </button>
          ) : null}

          <button
            className="topbar__screen-button"
            onClick={() => dispatch(openTopBarShareScreen())}
          >
            <ShareIcon isSelected={screen === 'SHARE'} />
          </button>
          {hasBuyLink ? (
            <button
              className="topbar__screen-button"
              onClick={() => dispatch(openTopBarShopScreen())}
            >
              <ShopIcon isSelected={screen === 'SHOP'} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(TopBar);
