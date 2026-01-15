import { useState, useEffect } from 'react';
import { LivePlayerContext } from '../bridge';
import defaultLogo from './pbs-logotype-white.png';
import { KIDS_LIVESTEAM_PROFILE } from '../constants';

import './multi-livestream-overlay.scss';

type MultiLivestreamOverlayProps = {
  context: LivePlayerContext;
  handleListingImage: (imageUrl: string) => void;
}

type Listing = {
  show_title: string,
  episode_title: string,
}

export interface Channel {
  profile?: string; // unconfirmed; ideally we will have this attribute in CS data
  feed_cid: string;
  digital_channel: string;
  analog_channel: string;
  short_name: string;
  full_name: string;
  timezone: string;
  feed_image: {
    white_logo?: string;
    color_logo?: string;
  };
  listings: Listing[],
  item_type: string;
}

// Helper function to parse listing data and return metadata string
// that appears beneath show title and episode title in Multi-Livestream overlay.
const formatMetadata = (listing) => {
  let videoType = '';
  let timeRemaining = '';
  // @TODO/Note: video_type is not currently returned in the CS response
  // TBD if this is actually feasible, but designs show e.g. "Special | 38 min remaining"
  if (listing?.video_type) {
    // capitalize first letter, e.g. "Episode" not "episode"
    videoType = listing.video_type.charAt(0).toUpperCase() + listing.video_type.slice(1);
  }
  // Calculating time remaining is complicated but at least doable with existing data
  if (listing.start_time && listing.duration) {
    timeRemaining = getTimeRemaining(listing);
  }
  // Only include a divider bar if both metadata items exist
  const connector = videoType && timeRemaining ? ' | ' : '';
  const metadata = `${videoType}${connector}${timeRemaining}`;

  return metadata;
}

// Helper function to parse start time, duration, and current time
// to return 'X mins remaining' piece of metadata
const getTimeRemaining = (listing) => {
  const startTime = new Date(listing.start_time);
  const durationInMilliseconds = listing.duration * 1000;
  const endTime = new Date(startTime.getTime() + durationInMilliseconds).getTime();
  const timeNow = new Date().getTime();
  const timeRemainingInMinutes = Math.floor((endTime - timeNow) / 60000);
  const timeRemainingInHours = Math.floor(timeRemainingInMinutes / 60);
  // if timeNow is later than the end time of the show, we're in a bad state
  // (the user clicked pause, or our data is outdated, etc.)
  if (timeNow > endTime) {
    return '';
  } else if (timeRemainingInHours > 0) {
    const remainderMinutes = timeRemainingInMinutes % 60;
    return `${timeRemainingInHours} hr${remainderMinutes > 0 ? ` ${remainderMinutes} min` : ''} remaining`;
  } else if (timeRemainingInMinutes > 0) {
    return `${timeRemainingInMinutes} min remaining`;
  } else {
    return 'Less than a minute remaining';
  }
}

// Helper function to determine if the first listing is still currently playing
// (Sometimes the CS response does not update the schedule response exactly
// at the time a new show starts playing; we are double checking)
const getCurrentListing = (listings) => {
  const now = new Date().getTime(); // milliseconds
  const firstListingEndTime =
    new Date(listings[0].start_time).getTime() +
    (listings[0].duration * 1000); // seconds * 1000 = milliseconds
  if (now < firstListingEndTime) {
    // if now is still earlier than the first listing end time, it's the current listing
    return listings[0];
  } else {
    // otherwise, we can reasonably assume the next listing has started playing
    return listings[1];
  }
}

export function MultiLivestreamOverlay(props: MultiLivestreamOverlayProps): JSX.Element | null {
  const { context, handleListingImage } = props;
  const queryParams = new URLSearchParams(window.location.search);

  const [channelLogo, setChannelLogo] = useState(defaultLogo.default);
  const [allChannels, setAllChannels] = useState([]);
  const [currentChannelCid, setCurrentChannelCid] = useState('');
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [ displayToggle, setDisplayToggle ] = useState(false);
  const [ displayScheduleLink, setDisplayScheduleLink ] = useState(false);
  const [listings, setListings] = useState(null);
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [metadata, setMetadata] = useState<string | null>(null);

  const isPartnerPlayer = context.playerType === 'ga_livestream_partner_player';

  // fetch listing data
  useEffect(() => {
    const getLivestreamListings = async () => {
      try {
        const scheduleEndpoint = `https://${window.location.host}/api/livestream-schedule/${context.stationId}`;
        const res = await fetch(scheduleEndpoint);
        const json = await res.json();
        const channels = await json.collections[0]?.content[0]?.channels;

        // Get the currently selected channel
        const currentChannel = channels.find(
          (channel) => channel.feed_cid === context.gaLiveStreamFeedCid,
        );

        // Get the listings for the currently selected channel
        const currentListings = await currentChannel?.listings;
        setListings(currentListings);

        // set the channel logo
        if (currentChannel?.feed_image?.white_logo) {
          setChannelLogo(currentChannel.feed_image.white_logo);
        }
        setCurrentChannel(currentChannel);
        const isKidsChannel = currentChannel?.profile === KIDS_LIVESTEAM_PROFILE;

        // we only need all of the channels info in the *partner player*
        if (isPartnerPlayer && !isKidsChannel) {
          const filteredChannels = channels.filter((channel: Channel) => channel.profile !== KIDS_LIVESTEAM_PROFILE);
          const hasMultipleChannels = filteredChannels.length > 1;

          setAllChannels(filteredChannels);

          if (context.options.channelToggle && hasMultipleChannels) {
            setDisplayToggle(true);
          }

          if (context.scheduleUrl && context.options.scheduleLink) {
            setDisplayScheduleLink(true);
          }

          setCurrentChannelCid(context.gaLiveStreamFeedCid);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    };

    getLivestreamListings();

    // get new listings every 10 minutes
    // @TODO: update with better interval? how often should this happen?
    const interval = setInterval(() => {
      getLivestreamListings();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // update current listing when new listings are fetched
  // and re-check current listing every minute
  // @TODO this function should now be handled by live-player.tsx
  // and passed back to this component via props.
  // We need to refactor to use functional components with hooks first.
  useEffect(() => {
    if (listings) {
      const interval = setInterval(() => {
        const currentListing = getCurrentListing(listings);
        handleListingImage(currentListing.listing_image);
        setCurrentListing(currentListing);
      }, 60 * 1000);
      const currentListing = getCurrentListing(listings);
      handleListingImage(currentListing.listing_image);
      setCurrentListing(getCurrentListing(listings));
      return () => clearInterval(interval);
    }
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    return () => {};
  }, [listings]);

  // update time remaining every minute
  useEffect(() => {
    if (currentListing) {
      const interval = setInterval(() => {
        setMetadata(formatMetadata(currentListing));
      }, 60 * 1000);

      setMetadata(formatMetadata(currentListing));
      return () => clearInterval(interval);
    }
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    return () => {};
  }, [currentListing]);

  // update player to new feed_cid
  const onChannelChange = (feed_cid: string) => {
    queryParams.set('feed_cid', feed_cid);
    queryParams.set('channel_switch', 'true');
    window.location.search = queryParams.toString();
  };

  let overlayClassNames = 'multi-livestream-overlay';

  if (displayToggle) {
    overlayClassNames += ' multi-livestream-overlay--with-toggle';
  }

  // to make it worth displaying this overlay, we should at least have the show title
  if (currentListing && currentListing.show_title) {
    return (
      <>
        {(displayToggle || displayScheduleLink) && (
          <div
            className={
              displayToggle
                ? 'multi-livestream-overlay__channel-select-link-wrapper has-channel-selector'
                : 'multi-livestream-overlay__channel-select-link-wrapper'
            }
          >
            {/* checks for MORE than 1 stream before rendering the channel switcher */}
            {displayToggle && (
              <label className="multi-livestream-overlay__channel-select-label">
                <span className="multi-livestream-overlay__channel-select-label-text">
                  Channel:
                </span>
                <select
                  className="multi-livestream-overlay__channel-select"
                  defaultValue={currentChannelCid}
                  onChange={(e) => onChannelChange(e.target.value)}
                >
                  {allChannels.map((channel: Channel) => {
                    return (
                      <option value={channel.feed_cid}>
                        {channel.full_name}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
            {displayScheduleLink && (
              <a
                href={context.scheduleUrl}
                className="multi-livestream-overlay__schedule-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                See Full Schedule
              </a>
            )}
          </div>
        )}
        <div className={overlayClassNames}>
          {(!isPartnerPlayer || !displayToggle) && channelLogo && (
            <img
              src={channelLogo}
              alt={currentChannel?.full_name}
              className="multi-livestream-overlay__channel-logo"
            />
          )}
          <h2 className="multi-livestream-overlay__show-title">
            {currentListing.show_title}
          </h2>
          {currentListing.episode_title && (
            <h3 className="multi-livestream-overlay__episode-title">
              {currentListing.episode_title}
            </h3>
          )}
          {metadata && (
            <p className="multi-livestream-overlay__metadata">{metadata}</p>
          )}
        </div>
      </>
    );
  } else {
    // otherwise, just skip displaying the component altogether
    return null;
  }
}
