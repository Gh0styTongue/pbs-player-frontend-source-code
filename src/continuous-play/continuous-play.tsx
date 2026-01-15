// imports
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useState, useEffect } from 'react';

// data
import { cancelCountDown, sendCommand } from './store';
import { GlobalState } from '../store';
import { Video, Context } from '../bridge';

// lib files
import * as iframe from '../lib/iframe';
import { getContinuousPlayVideo, ContinuousPlayData } from '../lib/api';
import { specifyResolution } from '../lib/images';

// components
import Clickable from '../shared/clickable';
import { featureTrackingEvent } from '../analytics/google-analytics-4';
import { NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO } from '../constants';
import ThumbnailProgress from './thumbnail-progress';

// svg's
import * as CloseIcon from './close-icon.svg';
import * as PassportCompassRose from './passport-compass-rose.svg';
import * as RightArrowWhite from './right-arrow--white.svg';

// styles
import './continuous-play.scss';

interface ContinuousPlayContentProps {
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  isPassport?: boolean;
  isPlayable?: boolean;
  thumbnail: string;
  countdownSeconds: number;
  thresholdSeconds: number;
  handleClose: () => void;
  handleClickContinuousPlay: () => void;
  context: Context;
  video: Video;
}

export function ContinuousPlayContent(props: ContinuousPlayContentProps): JSX.Element {
  const {
    title,
    showTitle,
    episodeTitle,
    isPassport,
    isPlayable,
    countdownSeconds,
    thresholdSeconds,
    thumbnail,
    handleClose,
    handleClickContinuousPlay,
    context,
    video
  } = props;

  // We omit the "watch something else" link if the user is a Passport member.
  // We infer a user's Passport status by looking at CS response flags 'is_mvod' and 'is_playable'
  // If it's a Passport video and also playable, that means the user can watch Passport videos
  const userIsPassport = isPassport && isPlayable;

  const [nonPassportContinuousPlayVideo, setNonPassportContinuousPlayVideo] = useState<ContinuousPlayData>();

  const progress =
    countdownSeconds > 0
      ? 100 - (100 * countdownSeconds) / thresholdSeconds
      : 100;

  useEffect(() => {
    // only make the call to get an alternate non-Passport video if:
    // 1. the video we're displaying in the pop-up is Passport
    // 2. we haven't already made this call
    if (isPassport && !nonPassportContinuousPlayVideo) {
      const continuousPlayVideoWithoutPassport = getContinuousPlayVideo(video.slug, context.stationId, context.userId);
      continuousPlayVideoWithoutPassport.then(
        (resp) => {
          setNonPassportContinuousPlayVideo(resp);
        }
      )
    }
  })

  const handleWatchAnotherVideoClick = () => {
    const message = {
      command: NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO,
      payload: nonPassportContinuousPlayVideo,
    }
    iframe.sendParentPostMessage(JSON.stringify(message));
  };

  return (
    <div className="continuous-play-content">
      <div className="continuous-play-close">
        <Clickable label="Cancel upcoming video" onClick={handleClose}>
          <img className="pbs-close" src={CloseIcon.default} alt="Close" />
        </Clickable>
      </div>

      <div className="continuous-play-main">
        {countdownSeconds && countdownSeconds > 0 ? (
          <div className="continuous-play-countdown">
            Up Next in{' '}
            <span className="continuous-play-countdown-seconds">
              {countdownSeconds}
            </span>
          </div>
        ) : (
          <div className="continuous-play-countdown">Up Next</div>
        )}

        <div className="continuous-play-show-title">{showTitle || 'PBS'}</div>
        <div className="continuous-play-title">
          {isPassport ? (
            <img
              className="passport__logo"
              src={PassportCompassRose.default}
              alt="Passport"
            />
          ) : null}
          {episodeTitle ? (
            <span className="continuous-play-meta">
              <span className="continuous-play-title-episode">
                {episodeTitle}
              </span>
              <span className="continuous-play-title-divider"> | </span>
            </span>
          ) : null}
          <span className="continuous-play-title-main">{title}</span>
        </div>
        {isPassport && !userIsPassport && (
          <button
            className="passport__skip-to-btn"
            onClick={handleWatchAnotherVideoClick}
            title="Surprise Me!"
          >
            <span className="passport__skip-to-text">Watch something else</span>
            <img
              className="passport__arrow"
              src={RightArrowWhite.default}
              alt=""
            />
          </button>
        )}
      </div>

      <div className="continuous-play-thumbnail">
        <Clickable label={`Play ${title}`} onClick={handleClickContinuousPlay}>
          <ThumbnailProgress
            thumbnail={thumbnail}
            progress={progress}
            isPassport={isPassport}
          />
        </Clickable>
      </div>
    </div>
  );
}

interface ContinuousPlayOverlayProps {
  dispatch: Dispatch;
  shouldDisplayContinuousPlay: boolean;
  countdownSeconds: number;
  countdownThresholdSeconds: number;
  continuousPlayData?: ContinuousPlayData;
  video: Video;
  context: Context;
}

function mapStateToProps(state: GlobalState): Partial<ContinuousPlayOverlayProps> {
  return {
    shouldDisplayContinuousPlay: state.continuousPlay.status === 'COUNTDOWN',
    countdownSeconds: state.continuousPlay.countdownSeconds || 0,
    countdownThresholdSeconds: state.continuousPlay.countdownThresholdSeconds || 0,
    continuousPlayData: state.continuousPlay.payload,
  };
}

const ContinuousPlayOverlay = (props: ContinuousPlayOverlayProps) => {
  const {
    dispatch,
    shouldDisplayContinuousPlay,
    countdownSeconds,
    countdownThresholdSeconds,
    continuousPlayData,
    video,
    context,
  } = props;

  const handleClose = () => {
    dispatch(cancelCountDown());
    featureTrackingEvent(
      {
        feature_category: 'continuous play',
        feature_name: 'continuous play overlay',
        object_name: 'close button',
        object_type: 'button',
        object_action: 'click',
        object_action_behavior: 'closes the overlay',
      },
      context,
    );
    dispatch(sendCommand(false, `hide-continuous-play`, continuousPlayData));
  };

  const handleClickContinuousPlay = () => {
    dispatch(sendCommand(false, NAVIGATE_TO_NEXT_CONTINUOUS_PLAY_VIDEO, continuousPlayData));
  };

  if (!shouldDisplayContinuousPlay || !continuousPlayData) {
    return null;
  }

  const thumbnail = specifyResolution(continuousPlayData.imageUrl, {
    width: 250,
    height: 140,
  });

  return (
    <div className="continuous-play-overlay">
      <ContinuousPlayContent
        title={continuousPlayData.title}
        showTitle={continuousPlayData.showTitle}
        episodeTitle={continuousPlayData.episodeTitle}
        isPassport={continuousPlayData.isPassport}
        isPlayable={continuousPlayData.isPlayable}
        thumbnail={thumbnail}
        countdownSeconds={countdownSeconds}
        thresholdSeconds={countdownThresholdSeconds}
        handleClose={handleClose}
        handleClickContinuousPlay={handleClickContinuousPlay}
        video={video}
        context={context}
      />
    </div>
  );
}

export default connect(mapStateToProps)(ContinuousPlayOverlay);
