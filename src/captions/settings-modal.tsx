import * as React from 'react';
import { connect } from 'react-redux';
import videojs from 'video.js';
import { Video } from '../bridge';
import { GlobalState } from '../store';
import {
  CaptionsStateVideoJs,
  closeCaptionsSettings,
  saveCaptionsSettings,
  changeCaptionsSettings,
  resetCaptionsSettings,
} from './store';
import {
  CaptionsFontSizes,
  CaptionsFontFamilies,
  CaptionsFontFamilyVideoJsLabels,
  CaptionsFontOpacities,
  CaptionsBackgroundOpacities,
  CaptionsWindowOpacities,
  CaptionsFontSizesLabels,
  CaptionsEdgeStyleLabels,
  CaptionsEdgeStyles,
  CaptionsOpacityLabels,
  CaptionsColors,
  CaptionColorsLabels,
  CaptionsFontSize,
  CaptionsFontFamilyVideoJs,
  CaptionsEdgeStyle,
  CaptionsFontOpacity,
  CaptionsBackgroundOrWindowOpacity,
  CaptionsColor,
} from './preview-styles';
import ColorPicker from './color-picker';
import Preview from './preview';
import './settings-modal.scss';

import * as closeIcon from './settings-modal-close.png';
import { Dispatch } from 'redux';

const COLOR_OPTIONS = CaptionsColors.map((c) => ({
  value: c,
  label: CaptionColorsLabels[c],
}));
const FONT_SIZE_OPTIONS = CaptionsFontSizes.map((c) => ({
  value: c,
  label: CaptionsFontSizesLabels[c],
}));
const FONT_FAMILY_OPTIONS = CaptionsFontFamilies.map((c) => ({
  value: c,
  label: CaptionsFontFamilyVideoJsLabels[c],
}));
const FONT_EDGE_STYLE_OPTIONS = CaptionsEdgeStyles.map((c) => ({
  value: c,
  label: CaptionsEdgeStyleLabels[c],
}));
const FONT_FONT_OPACITY_OPTIONS = CaptionsFontOpacities.map((c) => ({
  value: c,
  label: CaptionsOpacityLabels[c],
}));
const FONT_BACKGROUND_OPACITY_OPTIONS = CaptionsBackgroundOpacities.map(
  (c) => ({
    value: c,
    label: CaptionsOpacityLabels[c],
  })
);
const FONT_WINDOW_OPACITY_OPTIONS = CaptionsWindowOpacities.map((c) => ({
  value: c,
  label: CaptionsOpacityLabels[c],
}));

interface SettingsModalProps extends CaptionsStateVideoJs {
  video: Video;
  modal: videojs.ModalDialog;
  dispatch: Dispatch;
}

function mapStateToProps(state: GlobalState): Partial<SettingsModalProps> {
  return { ...state.captions };
}

/**
 * Closed captions settings component
 */
const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { dispatch, isSettingsOpen, previewStyle, modal } = props;
  const {
    fontPercent,
    fontFamily,
    edgeStyle,
    color,
    fontOpacity,
    backgroundColor,
    backgroundOpacity,
    windowColor,
    windowOpacity,
  } = previewStyle;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(closeCaptionsSettings(modal));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(saveCaptionsSettings(modal));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(resetCaptionsSettings());
  };

  if (!isSettingsOpen) {
    return null;
  }

  return (
    <div className="cc-settings">
      <div className="cc-settings__overlay" />
      <div className="cc-settings__modal">
        <div className="cc-settings__modal-header">
          <h1 className="cc-settings__title">Closed Captioning Settings</h1>
          <button className="cc-settings__close" onClick={handleClose}>
            <img src={closeIcon.default} alt="Close" />
          </button>
        </div>
        <form className="cc-settings__form" onSubmit={handleSubmit}>
          <Preview style={previewStyle} />
          <div className="cc-settings__options">
            <div className="cc-settings__basic-styles">
              <div className="cc-settings__font-size cc-settings__option">
                <label>
                  <p>Font Size</p>
                  <select
                    value={fontPercent}
                    onChange={(e) => {
                      dispatch(
                        changeCaptionsSettings({
                          fontPercent: e.target.value as CaptionsFontSize,
                        })
                      );
                    }}
                  >
                    {FONT_SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cc-settings__font-family cc-settings__option">
                <label>
                  <p>Font Family</p>
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      dispatch(
                        changeCaptionsSettings({
                          fontFamily: e.target.value as CaptionsFontFamilyVideoJs,
                        })
                      );
                    }}
                  >
                    {FONT_FAMILY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cc-settings__edge-style cc-settings__option">
                <label>
                  <p>Edge Style</p>
                  <select
                    value={edgeStyle}
                    onChange={(e) =>
                      dispatch(
                        changeCaptionsSettings({
                          edgeStyle: e.target.value as CaptionsEdgeStyle,
                        })
                      )
                    }
                  >
                    {FONT_EDGE_STYLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="cc-settings__colors">
              <div className="cc-settings__text-color cc-settings__option">
                <label>
                  <p>Text Color</p>
                  <ColorPicker
                    options={COLOR_OPTIONS}
                    selected={color}
                    onChange={(c) =>
                      dispatch(
                        changeCaptionsSettings({
                          color: c.value as CaptionsColor,
                        })
                      )
                    }
                  />
                </label>
              </div>
              <div className="cc-settings__background-color cc-settings__option">
                <label>
                  <p>Background Color</p>
                  <ColorPicker
                    options={COLOR_OPTIONS}
                    selected={backgroundColor}
                    onChange={(c) => {
                      dispatch(
                        changeCaptionsSettings({
                          backgroundColor: c.value as CaptionsColor,
                        })
                      );
                    }}
                  />
                </label>
              </div>
              <div className="cc-settings__window-color cc-settings__option">
                <label>
                  <p>Window Color</p>
                  <ColorPicker
                    options={COLOR_OPTIONS}
                    selected={windowColor}
                    onChange={(c) =>
                      dispatch(
                        changeCaptionsSettings({
                          windowColor: c.value as CaptionsColor,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>
            <div className="cc-settings__opacity">
              <div className="cc-settings__text-opacity cc-settings__option">
                <label>
                  <p>Text Opacity</p>
                  <select
                    value={fontOpacity}
                    onChange={(e) =>
                      dispatch(
                        changeCaptionsSettings({
                          fontOpacity: e.target.value as CaptionsFontOpacity,
                        })
                      )
                    }
                  >
                    {FONT_FONT_OPACITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cc-settings__background-opacity cc-settings__option">
                <label>
                  <p>Background Opacity</p>
                  <select
                    value={backgroundOpacity}
                    onChange={(e) =>
                      dispatch(
                        changeCaptionsSettings({
                          backgroundOpacity: e.target.value as CaptionsBackgroundOrWindowOpacity,
                        })
                      )
                    }
                  >
                    {FONT_BACKGROUND_OPACITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cc-settings__window-opacity cc-settings__option">
                <label>
                  <p>Window Opacity</p>
                  <select
                    value={windowOpacity}
                    onChange={(e) =>
                      dispatch(
                        changeCaptionsSettings({
                          windowOpacity: e.target.value as CaptionsBackgroundOrWindowOpacity,
                        })
                      )
                    }
                  >
                    {FONT_WINDOW_OPACITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </form>
        <div className="cc-settings__button-container">
          <button
            className="btn btn--fill--blue cc-settings__button"
            onClick={handleSave}
          >
            Save Settings
          </button>
          <button
            className="btn btn--ghost--white cc-settings__button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(SettingsModal);
