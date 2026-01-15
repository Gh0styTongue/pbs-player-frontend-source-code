import { Context, Video } from '../bridge';
import DonationScreen from './end-screen-donation';
import RelatedScreen from './end-screen-related';
import './end-screen.scss';

interface EndScreenProps {
  isOpen: boolean;
  context: Context;
  video: Video;
  player: videojs.VideoJsPlayer | HTMLElement | null;
}

const EndScreen = (props: EndScreenProps): JSX.Element | null => {
  const { isOpen, video, context } = props;

  // If continuous play is enabled, we skip rendering the endscreen.
  // Since there won't be enough time for users to interact
  // with the endscreen.
  const isContinuousPlay =
    context.playerType === 'portal_player' ||
    context.playerType === 'station_player';
  if (isContinuousPlay) {
    return null;
  }

  // Conditions under which to render the Donation endscreen.
  const shouldRenderDonate = video.videoType == 'full_length';

  if (!isOpen) {
    return null;
  }

  return (
    <div className="end-screen">
      <div className="end-screen__modal">
        {shouldRenderDonate ? (
          <DonationScreen video={video} donationLink={video.donationUrl} />
        ) : (
          <RelatedScreen video={video} context={context} />
        )}
      </div>
    </div>
  );
};

export default EndScreen;
