import { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import { elements, errorMessages } from '../constants';

import { SeekButton } from '../shared/controlbar-seek';
import { Spacer } from '../shared/controlbar-spacer';

import { PlaybackSpeedButton } from '../shared/controlbar-playback-rate';
import { ChapterSelectorButton } from './controlbar-chapters';
import VideoPlayer from './videojs';
import { CustomModalDialog } from '../shared/modal-dialog';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'videojs-contrib-quality-levels';
import '../vendor/videojs-vtt-thumbnails';
import hlsQualitySelector from '../vendor/hls-quality-selector/plugin';
import 'videojs-markers-plugin';
import 'videojs-playlist';
import {
  Video,
  Context,
  videoBridgeToVideo,
  contextBridgeToContext,
} from '../bridge';
import { getUrsData, UrsData } from '../lib/urs';
import { ErrorOverlay } from '../shared/ErrorOverlay';
import { LoadingIndicator } from '../shared/loading-indicator';
import { parseMessageData } from '../lib/iframe';
import * as detect from '../lib/detect';
import { encryptedMediaCheck } from '../lib/encrypted-media-check';
import { sendPostMessages, listenToPostMessages, dispatchPartnerMessages } from './post-message-legacy';
import {
  handlePostMessage,
  dispatchPostMessages,
} from '../shared/post-message';
import { getPlayerSetupOptions } from './player-setup';

import PlayerUI from './player-ui';
import * as playerStore from './store';
import * as captionsStore from '../captions/store';
import TopBar from '../topbar/topbar';
import { hideTopBar } from '../topbar/topbar';

import 'videojs-contrib-ads/dist/videojs.ads.css';
import 'videojs-ima/dist/videojs.ima.css';
import 'videojs-markers-plugin/dist/videojs.markers.plugin.min.css';
import './player.scss';

import { Dispatch, Store } from 'redux';
import {  MuxOptions } from '../analytics/mux';
import { QualityLevelsButton } from './controlbar-quality-selector';
import { parseDashQualityLevels } from './parse-dash-quality-levels';
import { PlaylistButton } from './controlbar-playlists';
import {
  playlistAccessibleVideosSources,
  AccessibilitySource,
} from './player-get-accessible-sources';
import { ManifestCaptionsButton } from '../shared/controlbar-manifest-captions';
import { CaptionsToggleButton } from './controlbar-cc-toggle-button';
import { LegacySidecarCaptionsButton } from '../shared/controlbar-sidecar-captions';
import { restoreCaptionsButtonFromLocalStorage } from '../captions/restore-captions-button';
import { getTextTracks } from '../shared/text-tracks';
import { ChapterMarker, getChapters } from '../lib/get-chapters';
import { AdvertisingOptions } from '../advertisement/get-advertising-options';
import { updateNativeNameTranslations } from '../lib/update-to-native-names';
import { filterTextTrackList } from '../captions/filter-text-track-list';
import { toggleButtonOff, toggleButtonOn } from '../captions/toggle-captions';
import { updateTimeInfo } from '../lib/time';
import { safePlay } from '../shared/safe-play';

interface VideoPlayerProps {
  context: Context;
  video: Video;
  modal: videojs.ModalDialog;
  store: unknown;
  dispatch: Dispatch;
}

export interface CustomComponentOptions extends videojs.ComponentOptions {
  name: string;
}

export interface VideoJsPBSPlayer extends VideoJsPlayer {
  ads?: any; //eslint-disable-line
  eme?: any; //eslint-disable-line
  dash?: any; //eslint-disable-line
  dashQualityLevels?: any[]; //eslint-disable-line
  dashQualityLevelsSelected?: number;
  playlist?: // getter
  | (() => AccessibilitySource[])
    // setter
    | ((arg0?: AccessibilitySource[]) => void)
    | {
        (lastIndex: () => number);
        currentItem: () => number | ((index: number) => void);
      };

  hlsQualitySelector?: (arg0: unknown) => void;
  vttThumbnails?: (arg0: unknown) => void;
  ima?: (arg0: AdvertisingOptions) => void;
  mux?: (arg0: MuxOptions) => void;
  markers?: (arg0: unknown) => void;
}

// TODO pull out type / interface definitions into our own shared ./types dir to cleanup and consolidate. They are scattered in a few places now (e.g., bridge.ts, player-helpers.ts).

export interface PlayerTimeInfo {
  type?: 'time';
  currentTime: number;
  duration: number;
  position: number;
  metadata?: unknown;
  seekRange: TimeRanges;
  start?: number;
  end?: number;
  viewable?: number;
}

export interface BitrateInfo {
  bitrate: number;
  width: number;
  height: number;
  qualityIndex: number;
}

// PLYR-643 we need to rely on our detect.isSafari() method, and *not*
// the videojs built in videojs.browser.IS_ANY_SAFARI method,
// which returns false for Chrome on iOS, which is technically
// a safari web view, so that breaks us on Chrome / iOS
const isSafari = detect.isSafari();
const isWebKit = detect.isWebKit();

export function PBSPlayer(props: VideoPlayerProps): JSX.Element | undefined {
  const { context, video, dispatch } = props;
  const [errorData, setErrorData] = useState<UrsData | undefined>(undefined);
  const [videoOptions, setVideoOptions] = useState<VideoJsPlayerOptions | undefined>(undefined);

  // Catch rare VideoJS/browser errors (content decryption, media source type errors, etc.) and present a branded error experience.
  const handlePlayerError = useCallback(
    (player: VideoJsPBSPlayer, dispatch: Dispatch) => {
      dispatch(playerStore.errorAction(player));
      setErrorData({ message: errorMessages.defaults });
    },
    [],
  );

  // Handles mounting and setup of the VideoJS player
  const handlePlayerMount = useCallback(() => {
    const playerEl: HTMLVideoElement | null = document.querySelector('video');
    const player: VideoJsPBSPlayer = videojs.getPlayer(elements.player) as VideoJsPBSPlayer;

    if (!playerEl || !player) {
      return;
    }

    // ----------------------------------------------------------
    // post messages
    // we only support post messages on portal & station players
    if (
      context.playerType === 'portal_player' ||
      context.playerType === 'station_player'
    ) {
      // Support postMessages for modern player embeds
      dispatchPostMessages(player);

      window.addEventListener(
        'message',
        (event) => {
          const data = parseMessageData(event.data);
          dispatch(playerStore.postMessageReceivedAction(data));
          handlePostMessage(player, data);
        },
        false,
      );
    } else if (
      context.playerType === 'partner_player' ||
      context.playerType === 'bento_player'
    ) {
      // Support for post messages that some partners (Frontline) requested
      // to further customize their partner player (resume watching without PBS SSO)
      dispatchPartnerMessages(player);

      // Support postMessages for legacy partner player
      sendPostMessages(player, video);
      listenToPostMessages(player);
    }

    // Custom extension of the ModalDialog class
    // This is what makes CC Settings modals in fullscreen possible
    const modal: videojs.ModalDialog = new CustomModalDialog(player, {
      label: 'Closed Captions Settings',
      temporary: false,
      name: 'Closed Captions Settings',
    });

    dispatch(playerStore.mountAction(player, video, context, modal));
    const timeInfo: PlayerTimeInfo = updateTimeInfo(playerEl);
    player.on('loadedmetadata', () => {
      dispatch(playerStore.loadedMetadataAction(player, video, context, timeInfo));
    });
    player.trigger("playerReady"); // post message to parent window

    const controlBar: videojs.Component | undefined =
      player.getChild('controlBar');

    if (isSafari) player.addClass('is-safari');
    // ----------------------------------------------------------
    // add the class to toggle the player's preview layout (simplified controls)
    if (
      context.options.previewLayout &&
      (context?.playerType == 'portal_player' ||
        context?.playerType == 'station_player')
    ) {
      player.addClass('preview-layout');

      // Show Detail heroes on portals might have a sponsorship row component present at certain breakpoints.
      // If so, we adjust the position of the controls based on a post message received from the portal.
    }

    // we only want to call this for DRM videos and not for Safari
    if (video.hasDrm && !isSafari) {
      // Html5DashJS doesn't exist on default videojs type, not sure if extending it is worth it
      // @ts-ignore
      if (typeof videojs.Html5DashJS === 'function') {
        // @ts-ignore
        videojs.Html5DashJS.hook(
          'beforeinitialize',
          encryptedMediaCheck(player, dispatch, handlePlayerError)
        );
      }
    }

    // for mobile in-line players, one tap for play/pause
    player.enableTouchActivity();

    if (controlBar) {
      const volumePanel = controlBar.getChild('volumePanel');
      if (volumePanel) {
        const muteToggle = volumePanel.children()[0];
        player.on(muteToggle, 'click', () => {
          player && dispatch(playerStore.muteAction(player.muted()));
        });
      }
    }

    // this is the mount point for our React Portal content
    // Expecting an error here due to bug in videojs type file for ModalDialog contentEl
    //@ts-expect-error
    modal.contentEl_.id = 'closed-captions-settings-modal-dialog';
    player.addChild(modal);

    playerEl.onplay = () => dispatch(playerStore.playAction());
    playerEl.onpause = () => dispatch(playerStore.pauseAction());
    playerEl.onended = () => dispatch(playerStore.completeAction());

    // for mobile, use touchevent
    playerEl.addEventListener(
      'touchstart',
      () => {
        if (player.paused()) {
          safePlay(player);
        } else {
          player.pause();
        }
      },
      { passive: true }
    );

    // Detect the first frame of playback
    // A bug with videojs 'firstplay' event not firing was preventing
    // the MediaStart event from ever firing on production.
    // The 'one' method will automatically unbind the event handler after it's been executed once.
    player.one('play', () => {
      dispatch(playerStore.firstFrameAction(player, context));

      // Special case for preview layout on isWebKit (Safari, iOS browsers, etc.)
      // We trigger a post message to the portal to adjust show detail elements
      // when the video is playing, since WebKit doesn't support styling
      // the text track safe area via CSS.
      if (
        context.options.previewLayout &&
        (context?.playerType == 'portal_player' ||
          context?.playerType == 'station_player') &&
        isWebKit
      ) {
        player.trigger('portalPreviewVideoIsPlayingWebKit');
      }

      if (
        context.playerType === 'partner_player' ||
        context.playerType === 'bento_player'
      ) {
        hideTopBar();
      }
    });

    // save volume settings changes for restoring on refresh
    // wait a short time before sending so you don't send too many dispatches.
    let volChange: NodeJS.Timeout;
    playerEl.onvolumechange = (event) => {
      clearTimeout(volChange);
      // since we use 'dom' in our tsconfig "lib" setting,
      // we need to specify the global vs browser setTimeout
      volChange = global.setTimeout(() => {
        if (event && event.target) {
          const target = event.target as HTMLVideoElement;
          const volume: number = target.volume;
          dispatch(playerStore.volumeAction(volume));
          // if the user sets their volume to 0, make sure the local storage value for muted
          // also gets set to 'true'
          if (volume === 0) {
            dispatch(playerStore.muteAction(true));
          } else {
            // VideoJsPlayers report volume 0 as muted "false", so in cases other than volume 0, just let the player's state determine the value to save
            player && dispatch(playerStore.muteAction(player.muted()));
          }
        }
      }, 1000);
    };

    playerEl.ontimeupdate = () => {
      const updatedTimeInfo: PlayerTimeInfo = updateTimeInfo(playerEl);
      dispatch(playerStore.timeAction(updatedTimeInfo, video));
    };

    player.on('ads-manager', (response) => {
      response.adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, () =>
        dispatch(playerStore.pauseAdAction())
      );
      response.adsManager.addEventListener(
        google.ima.AdEvent.Type.CLICK,
        () => {
          // @TODO clean up this hack, as well as our redux actions
          // - they don't seem to have an actual effect
          // We are literally just hitting the pause button
          const adPauseButton = document.querySelector(
            '#player-videojs_ima-play-pause-div:not(.ima-paused)'
          );
          // @ts-ignore
          if (adPauseButton) adPauseButton.click();
        }
      );
      response.adsManager.addEventListener(
        google.ima.AdEvent.Type.RESUMED,
        () => dispatch(playerStore.playAdAction())
      );
      response.adsManager.addEventListener(
        google.ima.AdEvent.Type.STARTED,
        () => dispatch(playerStore.playAdAction())
      );
      response.adsManager.addEventListener(
        google.ima.AdEvent.Type.COMPLETE,
        () => dispatch(playerStore.completeAdAction())
      );
    });

    // ----------------------------------------------------------
    // Enhanced Accessibility Videos
    const accessibilitySources = playlistAccessibleVideosSources(video);

    // -----------------------------------------------------
    // -----------------------------------------------------
    // ControlBar

    // Positioning

    // Check if this is a one-off livestream in a regular player (FVOD)
    // If the video is a VOD livestream, only show Closed Captions and Fullscreen buttons
    // Note: Audio Channel button automatically shows/hides based on the HLS manifest
    const showLiveUI: boolean | undefined = videoOptions && videoOptions.liveui;

    // Check if the video has chapters
    // If the video has chapters, the right-hand side button order should be:
    // Chapters, Playback Rate, Closed Captions, Quality Selector, Fullscreen
    const chapterMarkers: ChapterMarker[] = getChapters(video);
    const hasChapters: boolean = chapterMarkers && chapterMarkers.length > 0;

    const seekButtonPosition = 2;
    const spacerPosition = showLiveUI ? 5 : 7;
    const chapterButtonPosition = spacerPosition + 1;
    let playbackSpeedButtonPosition = hasChapters
      ? chapterButtonPosition + 1
      : chapterButtonPosition;
    let ccButtonPosition = showLiveUI
      ? spacerPosition + 1
      : playbackSpeedButtonPosition + 1;
    let audioButtonPosition = ccButtonPosition + 1;
    let qualityLevelsButtonPosition = audioButtonPosition + 1;
    // since DRM and non-DRM use different quality buttons (one custom, one from a plugin)
    // we need to set this relative position pretending like quality isn't there.
    const accessibilityButtonPosition = spacerPosition + 1;

    if (accessibilitySources) {
      ccButtonPosition = accessibilityButtonPosition + 1;
      audioButtonPosition = ccButtonPosition + 1;
      playbackSpeedButtonPosition = ccButtonPosition + 1;
      qualityLevelsButtonPosition = playbackSpeedButtonPosition + 1;
    }

    // -----------------------------------------------------
    // rewind 10 seconds
    const seekButton: videojs.Component = new SeekButton(player, {
      name: 'SeekButton',
    });
    if (controlBar) controlBar.addChild(seekButton, {}, seekButtonPosition);

    // -----------------------------------------------------
    // Spacer
    const spacer: videojs.Component = new Spacer(player, { name: 'Spacer' });
    if (controlBar) controlBar.addChild(spacer, {}, spacerPosition);

    // ----------------------------------------------------------
    // Chapter Selector and Chapter Progress Bar Markers

    if (!showLiveUI && hasChapters) {
      // Initialize the Chapter Selector button and attach to controlbar
      const chapterSelectorButton = new ChapterSelectorButton(
        player,
        { name: 'ChapterSelectorButton' },
        chapterMarkers
      );

      if (chapterSelectorButton) {
        if (controlBar) {
          controlBar.addChild(chapterSelectorButton, {}, chapterButtonPosition);
        }
      }

      // Display chapter markers in the progress bar using videojs-markers-plugin
      if (player.markers !== undefined) {
        player.markers({
          markers: chapterMarkers,
          markerTip: {
            text: (marker) => marker.text,
          },
        });
      }
    }

    if (typeof player.playlist !== 'undefined' && accessibilitySources) {
      //@ts-ignore
      //TODO fix 'not all members of playlist type being callable TypeError
      player.playlist(accessibilitySources);
      // start at the last item in the list
      //@ts-ignore
      player.playlist.currentItem(player.playlist.lastIndex());
      const playlistButton = new PlaylistButton(
        player,
        {
          name: 'PlaylistButton',
        },
        accessibilitySources
      );

      if (controlBar) {
        controlBar.addChild(playlistButton, {}, accessibilityButtonPosition);
      }
    }

    // ----------------------------------------------------------
    // Playback Speed

    if (!showLiveUI) {
      const playbackSpeedButton = new PlaybackSpeedButton(player, {
        name: 'PlaybackSpeedButton',
      });

      if (playbackSpeedButton) {
        if (controlBar)
          controlBar.addChild(
            playbackSpeedButton,
            {},
            playbackSpeedButtonPosition
          );

        player.on('ratechange', (playbackSpeedButton) => {
          dispatch(playerStore.changePlaybackSpeed(playbackSpeedButton));
        });
      }
    }

    // -----------------------------------------------------
    // Closed Captions Button

    // ----------------------------------------------------
    // Sidecar caption support for videos with DRM or MP4-only encoding (i.e., no HLS)
    if ((video.hasMp4Encodings && !video.hasHlsEncodings) || video.hasDrm) {
      // PLYR-782 use the legacy custom sidecar button to support DRM caption styling
      // until the videojs-contrib-dash plugin is patched: https://github.com/videojs/videojs-contrib-dash/issues/374
      const legacySidecarCaptionsButton = new LegacySidecarCaptionsButton(
        player,
        { name: 'LegacySidecarCaptionsButton' },
        modal,
        dispatch,
        player.options_.tracks || []
      );

      if (controlBar)
        controlBar.addChild(legacySidecarCaptionsButton, {}, ccButtonPosition);

      const textTracks = getTextTracks(player);

      // The following will restore the sidecar caption's mode based on the local storage value stored. It handles single and multi-language assets.
      //@ts-ignore
      textTracks.on('addtrack', (e) => {
        const track: TextTrack = e.track as TextTrack;
        dispatch(
          captionsStore.addSidecarCaption(
            track.language,
            legacySidecarCaptionsButton
          )
        );
      });
    } else {
      // ----------------------------------------------------
      // Manifest captions support for all other VOD players

      // We need to hide the "Customize" menu item for Safari/WebKit browsers since captions styling must be done via the os-provided tools.

      // Preview layout uses a special toggle button, which we keep hidden unless preview-layout is present
      const captionsToggleButton: videojs.Component = new CaptionsToggleButton(
        player,
        {}
      );
      controlBar &&
        controlBar.addChild(captionsToggleButton, {}, ccButtonPosition);

      // Customize the built-in captions menu
      const manifestCaptionsButton: videojs.Component =
        new ManifestCaptionsButton(
          player,
          {
            name: 'ClosedCaptionsButton',
          },
          modal,
          dispatch
        );
      controlBar &&
        controlBar.addChild(manifestCaptionsButton, {}, ccButtonPosition);

      // listen for text track changes
      const tracks: TextTrackList = player.textTracks();

      // restore the button's icon based on local storage (except Safari, where macOS
      // takes care of that for the user in Accessibility > Captions > "Prefer closed
      // captions" checkbox)
      if (!isSafari) {
        restoreCaptionsButtonFromLocalStorage(manifestCaptionsButton, tracks);
      } else {
        // for Safari, set the button icon based on tracks only.
        player.on('loadedmetadata', () => {
          setTimeout(() => {
            // filter out any tracks that aren't captions or subtitles
            const subsAndCapsOnly: TextTrack[] = filterTextTrackList(tracks);
            const allCaptionsOff: boolean = subsAndCapsOnly.every(
              (track: TextTrack) => track.mode === 'disabled'
            );
            if (allCaptionsOff) {
              manifestCaptionsButton && toggleButtonOff(manifestCaptionsButton);
            } else {
              manifestCaptionsButton && toggleButtonOn(manifestCaptionsButton);
            }
            // wait. otherwise, tracks might be empty (this is probably a WebKit thing).
          }, 50);
        });
      }

      //@ts-ignore
      tracks.on('addtrack', (e) => {
        const track: TextTrack = e.track as TextTrack;
        !isSafari &&
          dispatch(captionsStore.addTextTrack(track, manifestCaptionsButton));
      });

      //@ts-ignore
      tracks.on('change', () => {
        // toggle the captions button icon according to selection
        // save user selection to local storage
        dispatch(
          captionsStore.changeCurrentTextTrack(manifestCaptionsButton, isSafari)
        );
      });

      const audioTracks: videojs.AudioTrackList = player.audioTracks();

      // Listen to the "change" event for audio tracks.
      audioTracks.addEventListener('change', function () {
        for (let i = 0; i < audioTracks.length; i++) {
          // Loop through to the currently enabled audio track.
          const track = audioTracks[i];
          if (track.enabled) {
            // dispatch an event with the audio track "kind"
            dispatch(playerStore.changeCurrentAudioTrack(track.kind, context));
          }
        }
      });
    }

    // -----------------------------------------------------
    // Audio Selector

    if (controlBar) {
      const audioSelectorButton = controlBar.getChild('AudioTrackButton');

      if (audioSelectorButton) {
        // get the menuitem constructor
        const MenuItem = videojs.getComponent('MenuItem');
        // Create a menu title
        const audioButtonMenuTitle: videojs.MenuItem = new MenuItem(player, {
          label: 'Audio Selector',
          selectable: false,
        });
        audioButtonMenuTitle.addClass('vjs-menu-title');
        audioButtonMenuTitle.removeClass('vjs-menu-item');
        // slight delay to allow videojs to finish processing audio tracks
        // otherwise, it overwrites our additions to the menu
        setTimeout(() => {
          // update menu item labels to their native name translations
          updateNativeNameTranslations(audioSelectorButton);
          // add the menu title to the beginning
          const audioButtonChildren = audioSelectorButton.children();
          audioButtonChildren &&
            audioButtonChildren.length > 1 &&
            audioButtonChildren[1]
              .contentEl()
              .prepend(audioButtonMenuTitle.contentEl());
        }, 100);
      }
    }

    // Hide this div to avoid double captions on VOD DRM videos
    // ? this might go away once we migrate to CMAF and away from needing
    // ? videojs-contrib-dash on all DRM videos
    if (video.hasDrm && !isSafari) {
      playerEl.classList.add('hide-webkit-media-text-track-container');
    }

    // ----------------------------------------------------------
    // Quality Selector Button

    // Only initialize the quality selector on VOD assets, not for one-off VOD livestream events
    if (videoOptions && !showLiveUI) {
      if (video.hasDrm && !isSafari) {
        // DRM videos (DASH) use the custom Quality Levels menu
        player.on('loadedmetadata', parseDashQualityLevels.bind(null, player));
      } else {
        // non-DRM videos use the HlsQualitySelector quality levels menu
        if (hlsQualitySelector !== undefined) {
          // we set this to false to override the default "auto" control bar label with "HD" instead.
          player.hlsQualitySelector &&
            player.hlsQualitySelector({
              displayCurrentQuality: false,
              sortAscending: false,
              autoPlacement: 'top',
            });
        }
      }
    }

    // ------ DASH Quality Levels
    // Only initialize the plugin if the video has DRM
    if (video.hasDrm && !isSafari) {
      player.on('dashQualityLevels', function (e) {
        // Levels may contain two identical resolutions at different bitrates—
        // e.g., resulting in a menu with two '720p' options that appear the same
        // but aren't underneath.
        const levels: BitrateInfo[] = e.target.player.dashQualityLevels;

        if (!showLiveUI && levels) {
          const qualityLevelsButton = new QualityLevelsButton(
            player,
            {
              name: 'QualityLevelsButton',
            },
            levels
          );

          if (qualityLevelsButton) {
            if (controlBar)
              controlBar.addChild(
                qualityLevelsButton,
                {},
                qualityLevelsButtonPosition
              );
          }
        }
      });
    }

    // ---------------------------------------------------------
    // Trick Play

    if (
       // Don't initialize the plugin if VOD player is showing a special one-off livestream event.
      !showLiveUI &&
      video.trickPlayFileUrl &&
      typeof player.vttThumbnails === 'function'
    ) {
      player.vttThumbnails({
        src: video.trickPlayFileUrl,
      });
    }

    setTimeout(() => {
      // Get the MouseTimeDisplay component and remove the hidden class
      const mouseTimeDisplay = player.$('.vjs-mouse-display');
      if (mouseTimeDisplay) {
        mouseTimeDisplay.classList.remove('vjs-hidden');
      }
    }, 1000);

    // We send post messages to the embedded-player's surrounding portal in order to synchronize
    // player controls fading in/out with portal visual elements (info overlays, etc.)
    if (
      context.playerType === 'portal_player' ||
      context.playerType === 'station_player'
    ) {
      player.on('useractive', () => {
        player.trigger('userIsHoveringOverVideo');
      });
      player.on('userinactive', () => {
        player.trigger('userNotHoveringOverVideo');
      });
    }

    // ----------------------------------------------------------

    player.on('error', () => {
      handlePlayerError(player, dispatch);
    });
  }, [context, video, dispatch, videoOptions, handlePlayerError]);

  // Fetch URS data and setup video options
  useEffect(() => {
    getUrsData(video)
      .then((data: UrsData[]) => {
        const videoOptions: VideoJsPlayerOptions = getPlayerSetupOptions(
          data,
          video,
          context
        );
        const playerEl: HTMLVideoElement | null =
          document.querySelector('video');
        if (playerEl) {
          handlePlayerMount();
        }
        setVideoOptions(videoOptions);
      })
      .catch((error) => {
        setErrorData(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, context]);

  if (errorData) {
    return (
      <div className="wrapper wrapper--error">
        <ErrorOverlay errorData={errorData} />
      </div>
    );
  }

  // don't render VideoPlayer until the Promise resolves with updated player props.
  if (!videoOptions) {
    return;
  }

  const dimensionStyle =
    context.options.width && context.options.height
      ? {
          width: context.options.width,
          height: context.options.height,
          margin: '0 auto',
        }
      : {};

  return (
    <div style={dimensionStyle}>
      <TopBar context={context} video={video} />

      <div className="wrapper" data-vjs-player>
        <PlayerUI video={video} context={context} />

        <div>
          <VideoPlayer
            {...videoOptions}
            mounted={handlePlayerMount}
            video={video}
            context={context}
          />
          <LoadingIndicator />
        </div>
      </div>
    </div>
  );
}

const PlayerContainer = connect()(PBSPlayer);

export function renderPlayer(store: Store): void {
  const video = videoBridgeToVideo(window['videoBridge']);
  const context = contextBridgeToContext(window['contextBridge']);

  const videoJsPlayer: Provider = (
    <Provider store={store}>
      <PlayerContainer video={video} context={context} store={store} />
    </Provider>
  );

  ReactDOM.render(videoJsPlayer, document.getElementById(elements.root));
}
