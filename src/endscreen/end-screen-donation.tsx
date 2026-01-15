
import { Video } from '../bridge';
import './end-screen-donation.scss';

interface DonationScreenProps {
  video: Video;
  donationLink?: string;
}

const DonationScreen = (props: DonationScreenProps): JSX.Element => {
  const donateLink = props.donationLink || 'https://www.pbs.org/donate/';

  return (
    <div className="player-donate">
      <div className="player-donate__header">
        <h2 className="player-donate__title">Did you enjoy the video?</h2>
        <p className="player-donate__subtitle">
          We’re working every day to create content that educates, informs, and
          inspires.
        </p>
      </div>
      <div className="player-donate__content">
        <p className="player-donate__lg-text">
          Quality PBS content is available to everyone online thanks to viewers
          like you.
        </p>
        <p className="player-donate__lg-text">
          Help us achieve our mission by supporting your local station.
        </p>
        <p className="player-donate__sm-text">
          Support your local station and help us in our mission to provide
          content that educates, informs, and inspires.
        </p>

        {props.video.stationColorLogo && props.video.shortCommonName && (
          <div className="player-donate__station-info">
            <a href={donateLink} target="_blank" rel="noopener noreferrer">
              <img
                className="player-donate__station-logo"
                src={props.video.stationColorLogo}
              />
            </a>
            <a
              className="player-donate__station-name"
              href={donateLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.video.shortCommonName}
            </a>
          </div>
        )}

        <div className="player-donate__btn-container">
          <a
            className="player-donate__btn"
            href={donateLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default DonationScreen;
