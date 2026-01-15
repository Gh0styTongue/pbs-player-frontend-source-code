import * as React from 'react';
import parseInt from 'lodash-es/parseInt';

import { Video } from '../../bridge';
import { formatDuration } from '../../lib/time';

import './embed-screen.scss';

const DEFAULT_IFRAME_WIDTH = 512;
const DEFAULT_IFRAME_HEIGHT = 332;
const MINIMUM_IFRAME_WIDTH = 320;
const MINIMUM_IFRAME_HEIGHT = 224;
const ASPECT_RATIO = 1.77; // 16:9
const TOPBAR_HEIGHT = 43; // This is the height of the viralplayer topbar, which needs to be included in the iframe dimensions, but is not included in the aspect ratio.

interface EmbedScreenProps {
  video: Video;
  widthInput: string;
  heightInput: string;
  handleClose: () => void;
  handleChangeWidth: (arg0: React.ChangeEvent<HTMLInputElement>) => void;
  handleChangeHeight: (arg0: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputClick: (
    arg0: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => void;
}

export function calculateProportionalHeight(width: number): string {
  const proportionalHeight = Math.round(
    width / ASPECT_RATIO + TOPBAR_HEIGHT
  ).toString();

  return proportionalHeight;
}

export function calculateProportionalWidth(height: number): string {
  const proportionalWidth = Math.round(
    (height - TOPBAR_HEIGHT) * ASPECT_RATIO
  ).toString();

  return proportionalWidth;
}

export function parseNumber(
  n: string,
  fallback: number,
  minimum: number
): number {
  let parsed = parseInt(n);

  // use default, normal-size dimensions for negative numbers or gibberish
  parsed = parsed > 0 ? parsed : fallback;

  // use minimum dimensions for non-negative numbers that are just too small
  return parsed < minimum ? minimum : parsed;
}

export function formatEmbedCode(
  widthInput: string,
  heightInput: string,
  video: Video
): string {
  const embedUrl = `https://player.pbs.org/viralplayer/${video.id}/`;
  const width = parseNumber(
    widthInput,
    DEFAULT_IFRAME_WIDTH,
    MINIMUM_IFRAME_WIDTH
  );
  const height = parseNumber(
    heightInput,
    DEFAULT_IFRAME_HEIGHT,
    MINIMUM_IFRAME_HEIGHT
  );
  return `<iframe width="${width}" height="${height}" src="${embedUrl}" allowfullscreen style="border: 0;"></iframe>`;
}

export function responsiveEmbedCode(video: Video): string {
  const embedUrl = `https://player.pbs.org/viralplayer/${video.id}/`;
  return `<div class="pbs-viral-player-wrapper" style="position: relative; padding-top: calc(56.25% + 43px);">
      <iframe src="${embedUrl}" allowfullscreen
        style="position: absolute; top: 0; width: 100%; height: 100%; border: 0;"></iframe>
    </div>`;
}

export function EmbedScreen(props: EmbedScreenProps): JSX.Element {
  const {
    widthInput,
    heightInput,
    video,
    handleClose,
    handleChangeWidth,
    handleChangeHeight,
    handleInputClick,
  } = props;

  return (
    <div className="embed-screen">
      <div className="embed-screen__header">
        <h2 className="embed-screen__heading">Embed Video</h2>
        <button
          className="embed-screen__close topbar__close-btn"
          onClick={() => handleClose()}
        >
          Return to Video
        </button>
      </div>

      <div className="embed-screen__detail">
        <p className="embed-screen__title">{video.title}</p>
        <p className="embed-screen__description">
          {video.shortDescription}
          <span className="embed-screen__duration">
            {' '}
            ({formatDuration(video.duration)})
          </span>
        </p>
      </div>

      <h3 className="embed-screen__options-title">Fixed iFrame</h3>

      <div className="embed-screen__options">
        <div className="embed-screen__dimensions">
          <div className="embed-screen__width">
            <label>Width</label>
            <input
              type="number"
              min={MINIMUM_IFRAME_WIDTH}
              name="embed-width"
              value={widthInput}
              onClick={(e) => handleInputClick(e)}
              onChange={(e) => handleChangeWidth(e)}
            />
          </div>

          <div className="embed-screen__height">
            <label>Height</label>
            <input
              type="number"
              min={MINIMUM_IFRAME_HEIGHT}
              name="embed-height"
              value={heightInput}
              onClick={(e) => handleInputClick(e)}
              onChange={(e) => handleChangeHeight(e)}
            />
          </div>
        </div>

        <div className="embed-screen__iframe">
          <input
            type="text"
            name="embed-iframe"
            className="embed-fixed-iframe"
            onClick={(e) => handleInputClick(e)}
            value={formatEmbedCode(widthInput, heightInput, video)}
          />
          <span>Please copy this text to your clipboard.</span>
        </div>
      </div>

      <h3 className="embed-screen__options-title">Responsive iFrame</h3>
      <div className="embed-screen__options">
        <div className="embed-screen__iframe">
          <input
            type="text"
            name="embed-responsive-iframe"
            className="embed-responsive-iframe"
            onClick={(e) => handleInputClick(e)}
            value={responsiveEmbedCode(video)}
          />
          <span>Please copy this text to your clipboard.</span>
        </div>
      </div>
    </div>
  );
}

interface EmbedScreenContainerProps {
  video: Video;
  handleClose: () => void;
}

function EmbedScreenContainer(props: EmbedScreenContainerProps): JSX.Element {
  const { video, handleClose } = props;
  const [widthInput, setWidthInput] = React.useState(String(DEFAULT_IFRAME_WIDTH));
  const [heightInput, setHeightInput] = React.useState(String(DEFAULT_IFRAME_HEIGHT));

  const handleChangeWidth = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const width = Number(e.target.value);
    setWidthInput(String(width));
    setHeightInput(calculateProportionalHeight(width));
  };

  const handleChangeHeight = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const height = Number(e.target.value);
    setHeightInput(String(height));
    setWidthInput(calculateProportionalWidth(height));
  };

  const handleInputClick = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>
  ): void => {
    (e.target as HTMLInputElement).select();
  };

  return (
    <EmbedScreen
      video={video}
      handleClose={handleClose}
      widthInput={widthInput}
      heightInput={heightInput}
      handleChangeWidth={handleChangeWidth}
      handleChangeHeight={handleChangeHeight}
      handleInputClick={handleInputClick}
    />
  );
}

export default EmbedScreenContainer;
