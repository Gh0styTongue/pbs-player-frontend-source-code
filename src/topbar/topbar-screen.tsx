
import { connect } from 'react-redux';

import { Video, Context } from '../bridge';

import { GlobalState } from '../store';
import { ScreenState, closeTopBarScreen } from './store';
import InfoScreen from './info/info-screen';
import EmbedScreen from './embed/embed-screen';
import ShareScreen from './share/share-screen';
import ShopScreen from './shop/shop-screen';
import { VideoJsPBSPlayer } from '../player/player';

import './topbar-screen.scss';
import { Dispatch } from 'redux';

interface TopBarScreenProps {
  player: VideoJsPBSPlayer;
  video: Video;
  context: Context;
  dispatch: Dispatch;
  screen: ScreenState;
}

function mapStateToProps(state: GlobalState): Partial<TopBarScreenProps> {
  return {
    screen: state.topBar.screen,
  };
}

function TopBarScreen(props: TopBarScreenProps) {
  const { screen, player, dispatch, video, context } = props;

  if (screen === 'CLOSED') {
    return null;
  }

  const componentsByScreen = {
    INFO: InfoScreen,
    EMBED: EmbedScreen,
    SHARE: ShareScreen,
    SHOP: ShopScreen,
  };
  const ActiveScreen = componentsByScreen[screen];

  return (
    <div className="topbar-screen">
      <ActiveScreen
        video={video}
        context={context}
        handleClose={() => dispatch(closeTopBarScreen(player))}
      />
    </div>
  );
}

export default connect(mapStateToProps)(TopBarScreen);
