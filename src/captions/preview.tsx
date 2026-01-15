import { getRGBAVideoJs } from '../lib/color';
import {
  CaptionsStyleVideoJs,
  CaptionsFontSizesLabels,
  CaptionsFontSize,
  CaptionsColor,
} from './preview-styles';

import './preview.scss';

function getPreviewStyle(
  style: CaptionsStyleVideoJs
): Partial<CaptionsStyleVideoJs> {
  const fontRGBA: string = getRGBAVideoJs(
    style.color,
    Number(style.fontOpacity)
  );
  const backgroundRGBA: string = getRGBAVideoJs(
    style.backgroundColor,
    Number(style.backgroundOpacity)
  );
  const windowRGBA: string = getRGBAVideoJs(
    style.windowColor,
    Number(style.windowOpacity)
  );
  const borderStyle: string =
    style.windowOpacity == '0' ? String(0) : `5px solid ${windowRGBA}`;
  const textShadow = {
    none: 'none',
    dropshadow: 'rgba(0,0,0,0.8) 0px 2px 1px',
    raised: [
      'rgba(0,0,0,0.8) 0px 0px 5px',
      'rgba(0,0,0,0.8) 0px 1px 5px',
      'rgba(0,0,0,0.8) 0px 2px 5px',
    ].join(','),
    depressed: 'rgba(0,0,0,0.8) 0px -2px 1px',
    uniform: [
      'rgba(0,0,0,0.8) -2px 0px 1px',
      'rgba(0,0,0,0.8) 2px 0px 1px',
      'rgba(0,0,0,0.8) 0px -2px 1px',
      'rgba(0,0,0,0.8) 0px 2px 1px',
      'rgba(0,0,0,0.8) -1px 1px 1px',
      'rgba(0,0,0,0.8) 1px 1px 1px',
      'rgba(0,0,0,0.8) 1px -1px 1px',
      'rgba(0,0,0,0.8) 1px 1px 1px',
    ].join(','),
  };
  const fontPercent: string = CaptionsFontSizesLabels[style.fontPercent];
  const fontMap = {
    monospace: 'monospace',
    sansSerif: 'sans-serif',
    serif: 'serif',
    monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
    monospaceSerif: '"Courier New", monospace',
    proportionalSansSerif: 'sans-serif',
    proportionalSerif: 'serif',
    casual: '"Comic Sans MS", Impact, fantasy',
    script: '"Monotype Corsiva", cursive',
    smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif',
  };

  // const noneEdgeStyle: CaptionsEdgeStyle = 'none';
  // const fontOpacity: CaptionsFontOpacity = '1';
  // const backgroundOpacity: CaptionsBackgroundOrWindowOpacity = '1';
  // const windowOpacity: CaptionsBackgroundOrWindowOpacity = '1';

  const previewStyle = {
    color: fontRGBA as CaptionsColor,
    fontPercent: fontPercent as CaptionsFontSize,
    fontFamily: fontMap[style.fontFamily],
    backgroundColor: backgroundRGBA as CaptionsColor,
    backgroundClip: 'padding-box',
    windowColor: windowRGBA as CaptionsColor,
    border: borderStyle,
    textShadow: textShadow[style.edgeStyle],
    // edgeStyle: noneEdgeStyle,
    // fontOpacity: fontOpacity,
    // backgroundOpacity: backgroundOpacity,
    // windowOpacity: windowOpacity,
  };

  return previewStyle;
}

interface PreviewProps {
  style: CaptionsStyleVideoJs;
}

/**
 * Preview of closed captions for the settings modal
 */
function Preview({ style }: PreviewProps): JSX.Element {
  const previewStyle: Partial<CaptionsStyleVideoJs> = getPreviewStyle(style);
  previewStyle.fontSize = previewStyle.fontPercent;
  return (
    <div className="cc-settings__preview-container">
      <h2 className="cc-settings__preview-header">Preview</h2>
      <div className="cc-settings__preview">
        <p className="cc-settings__preview-text" style={previewStyle}>
          Captions look like this
        </p>
      </div>
    </div>
  );
}

export default Preview;
