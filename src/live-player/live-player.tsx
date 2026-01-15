import { useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import videojs, { VideoJsLogo, VideoJsPlayerOptions } from 'video.js';
import 'videojs-logo';
import {
  elements,
  errorMessages,
  FALLBACK_LIVESTREAM_POSTER_IMAGE_URL,
  locationRequest,
} from '../constants';
import { safePlay } from '../shared/safe-play';
import LiveStreamPlayer, { PBSPlayerLivestream } from './videojs';
import { SeekButton } from '../shared/controlbar-seek';
import { Spacer } from '../shared/controlbar-spacer';
import {
  LivePlayerContext,
  livePlayerContextBridgeToLivePlayerContext,
  LivestreamAvailability,
} from '../bridge';
import { getLivePlayerOptions } from './live-player-setup';
import { UrsData } from '../lib/urs';
import {
  handlePostMessage,
  dispatchPostMessages,
} from '../shared/post-message';
import { ErrorOverlay } from '../shared/ErrorOverlay';
import { parseMessageData } from '../lib/iframe';
import * as detect from '../lib/detect';
import { encryptedMediaCheck } from '../lib/encrypted-media-check';
import { getDeviceLocation } from './geolocationCheck';
import {
  checkIfInServiceArea,
  checkIfIpAddressInServiceArea,
} from '../lib/api';
import * as playerStore from './store';
import * as captionsStore from '../captions/store';

import './live-player.scss';
import { LivePlayerUIContainer } from './live-player-ui';
import { CustomModalDialog } from '../shared/modal-dialog';
import { Dispatch, Store } from 'redux';
import { PosterOverlay } from './overlays/PosterOverlay';
import { ManifestCaptionsButton } from '../shared/controlbar-manifest-captions';
import { restoreCaptionsButtonFromLocalStorage } from '../captions/restore-captions-button';
import { updateNativeNameTranslations } from '../lib/update-to-native-names';
import { filterTextTrackList } from '../captions/filter-text-track-list';
import { toggleButtonOff, toggleButtonOn } from '../captions/toggle-captions';
import { MultiLivestreamOverlay } from './multi-livestream-overlay';

interface LivePlayerProps {
  context: LivePlayerContext;
  dispatch: Dispatch;
}

/**
 * Main player component. It is the root component that is in charge
 * of mounting and initializing all other player components.
 */
export function LivePlayer(props: LivePlayerProps): JSX.Element | undefined {
  const { context, dispatch } = props;

  const [livestreamAvailability, setLivestreamAvailability] = useState<LivestreamAvailability>(LivestreamAvailability.idle);
  const [errorData, setErrorData] = useState<UrsData | undefined>(undefined);
  const [videoOptions, setVideoOptions] = useState<VideoJsPlayerOptions | undefined>(undefined);

  // PLYR-643 we need to rely on our detect.isSafari() method, and *not*
  // the videojs built in videojs.browser.IS_ANY_SAFARI method,
  // which returns false for Chrome on iOS, which is technically
  // a safari web view, so that breaks us on Chrome / iOS
  const isSafari = detect.isSafari();

  // Secondary Localization Method: Geolocation API (browser-based)
  const checkGeolocation = useCallback(async () => {
    const userStation = context.stationId;
    setLivestreamAvailability(LivestreamAvailability.evaluating);

    try {
      const devicePosition = await getDeviceLocation();

      // For GA Livestream, the backend prefers cookie over query param for unlocalized users' station_id.
      if (!userStation) {
        throw new Error('Error: User could not be localized.');
      }

      const isAvailable = await checkIfInServiceArea(
        userStation,
        devicePosition.coords.latitude,
        devicePosition.coords.longitude
      );

      if (isAvailable) {
        setLivestreamAvailability(LivestreamAvailability.success);
      } else {
        setLivestreamAvailability(LivestreamAvailability.rejected);
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      // error codes 1 & 2 are when location is denied
      // for some reason
      if (geoError.code && (geoError.code === 1 || geoError.code === 2)) {
        setTimeout(() => {
          setLivestreamAvailability(LivestreamAvailability.locationDenied);
        }, 500);
      } else if (geoError.code && geoError.code === 3) {
        // error code 3 is a timeout
        setLivestreamAvailability(LivestreamAvailability.locationTimedOut);
      }
    }
  }, [context.stationId]);

  // If the primary localization method (IP address) fails, then check if the user has already granted geolocation sharing,
  // prompt if not. If granted, go right to the playable livestream and not the location request screen.
  // Note: This only works on Chrome, Edge, Firefox, and Opera. The Permissions API doesn't support Safari,
  // so we can't detect if the user has previously allowed/denied location services and hit "Remember this decision".
  // To get around this limitation, we simply send the user to the Location Request screen with "Start Watching" button every time.
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions
  const checkSavedPermissions = useCallback(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((response) => {
        switch (response.state) {
          case 'prompt':
            setLivestreamAvailability(LivestreamAvailability.locationNeeded);
            break;
          case 'granted':
            // If the user chooses to let the browser remember their decision, and the decision is Allow,
            // then it will bypass our geolocation checks that happen in LocationRequestScreen.
            // So, we check for "granted" in the constructor and then go ahead and double check that their device location is within the coverage area.
            checkGeolocation();
            break;
          case 'denied':
            setLivestreamAvailability(LivestreamAvailability.locationNeeded);
            break;
          default:
            setLivestreamAvailability(LivestreamAvailability.idle);
            break;
        }
      });
    } else {
      // On unsupported browsers, default to prompting them for their location.
      setLivestreamAvailability(LivestreamAvailability.locationNeeded);
    }
  }, [checkGeolocation]);

  // Primary Localization Method: IP Address
  const checkAvailability = useCallback(async () => {
    const userStation = context.stationId;

    setLivestreamAvailability(LivestreamAvailability.evaluating);

    try {
      // The IP Address is being captured on the backend using request headers (X_FORWARDED_FOR)
      const isAvailable = await checkIfIpAddressInServiceArea(userStation);

      if (isAvailable) {
        setLivestreamAvailability(LivestreamAvailability.success);
      } else {
        /*
          Localization should check by IP first and use browser-based geolocation as fallback
          if the user is determined to be outside viewing area. Before prompting for the user's geolocation,
          check if they have previously granted permissions so we don't needlessly bug them.
        */
        checkSavedPermissions();
      }
    } catch (error) {
      // If IP geolocation fails (network error, API error, etc.), fall back to browser geolocation
      checkSavedPermissions();
    }
  }, [context.stationId, checkSavedPermissions]);

  const handlePlayerError = useCallback((player: PBSPlayerLivestream) => {
    // Catch rare VideoJS/browser errors (content decryption, media source type errors, etc.) and present a branded error experience.
    dispatch(playerStore.errorAction(player));
    setErrorData({ message: errorMessages.livestreamError });
  }, [dispatch]);

  // Mount player and attach event handlers
  const handlePlayerMount = useCallback(() => {
    // Attach event handlers here for any player related events
    // Note that most player event callback must be attached AFTER
    // player.setup is called
    const playerEl = document.querySelector('video');
    const player: PBSPlayerLivestream = videojs.getPlayer(elements.livePlayer) as PBSPlayerLivestream;

    if (!playerEl || !player) {
      return;
    }

    // we don't want to call this for Safari
    if (!isSafari) {
      // Html5DashJS doesn't exist on default videojs type, not sure if extending it is worth it
      // @ts-ignore
      if (typeof videojs.Html5DashJS === 'function') {
        // @ts-ignore
        videojs.Html5DashJS.hook(
          'beforeinitialize',
          () => encryptedMediaCheck(player, dispatch, handlePlayerError)
        );
      }
    }

    const controlBar = player.getChild('controlBar');

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

    // Custom extension of the ModalDialog class
    // This is what makes CC Settings modals in fullscreen possible
    const modal: videojs.ModalDialog = new CustomModalDialog(player, {
      label: 'Closed Captions Settings',
      temporary: false,
      name: 'Closed Captions Settings',
    });

    // this is the mount point for our React Portal content
    // Expecting an error here due to bug in videojs type file for ModalDialog contentEl
    // @ts-expect-error
    modal.contentEl_.id = 'closed-captions-settings-modal-dialog';
    player.addChild(modal);

    // Dispatch the player mount action
    dispatch(playerStore.mountAction(player, context, modal));

    const setLogo = () => {
      const options: VideoJsLogo.Options = {
        image: context.stationLogo,
        position: `bottom-right`,
      };
      player.logo(options);
    };

    // we should only display a logo if the feed is set to display it
    if (context.displayLogoOverlay) {
      setLogo();
    }

    // Dispatch player callbacks as actions to be handled by redux middleware
    playerEl.onplay = () => dispatch(playerStore.playAction());
    playerEl.onpause = () => dispatch(playerStore.pauseAction());
    playerEl.onended = () => dispatch(playerStore.completeAction());

    // for mobile, use touchevent
    playerEl.ontouchstart = () => {
      if (player.paused()) {
        safePlay(player);
      } else {
        player.pause();
      }
    };

    player.on('loadedmetadata', () => {
      // Dispatch the loaded metadata action
      dispatch(playerStore.loadedMetadataAction(player, context));
    });

    // save volume settings changes for restoring on refresh
    // wait a short time before sending so you don't send too many dispatches.
    let volChange: any;
    playerEl.onvolumechange = (event) => {
      clearTimeout(volChange);
      volChange = setTimeout(() => {
        if (event && event.target) {
          const target = event.target as HTMLVideoElement;
          const volume: number = target.volume;
          dispatch(playerStore.volumeAction(volume));
          // if the user sets their volume to 0, make sure the local storage value for muted
          // also gets set to 'true'
          if (volume === 0) {
            dispatch(playerStore.muteAction(true));
          } else {
            // otherwise, use the player's state to determine the value to save.
            player && dispatch(playerStore.muteAction(player.muted()));
          }
        }
      }, 1000);
    };

    // Support for post messages - useful for listening to
    // spacebar keypress to start playback.
    // We only support this in the livestream portal & station players.
    if (
      context.playerType === 'ga_livestream_portal_player' ||
      context.playerType === 'ga_livestream_station_player'
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
        false
      );
    }

    // Detect the first frame of playback
    // A bug with videojs 'firstplay' event not firing was preventing
    // the MediaStart event from ever firing on production.
    // The 'one' method will automatically unbind the event handler after it's been executed once.
    // We also transmit the currentTime in the stream at first frame for calculating MediaStop duration watched values.
    player.one('play', () =>
      dispatch(playerStore.firstFrameAction(playerEl.currentTime))
    );

    playerEl.ontimeupdate = () => {
      const timeInfo: playerStore.LivePlayerTimeInfo = {
        currentTime: playerEl.currentTime,
        position: playerEl.currentTime,
      };
      dispatch(playerStore.timeAction(timeInfo));
    };

    // -----------------------------------------------------
    // rewind 10 seconds button
    const seekButton = new SeekButton(player, { name: 'SeekButton' });
    if (controlBar) controlBar.addChild(seekButton, {}, 2);

    // -----------------------------------------------------
    // Spacer
    const spacer = new Spacer(player, { name: 'Spacer' });
    if (controlBar) controlBar.addChild(spacer, {}, 5);

    // -----------------------------------------------------
    // Closed Captions button

    // We need to hide the "Customize" menu item for Safari/WebKit browsers since captions styling must be done via the os-provided tools.
    if (isSafari) player.addClass('is-safari');

    const manifestCaptionsButton: videojs.Component =
      new ManifestCaptionsButton(
        player,
        {
          name: 'ClosedCaptionsButton',
        },
        modal,
        dispatch
      );
    if (controlBar) controlBar.addChild(manifestCaptionsButton, {}, 6);

    // listen for changes in text tracks
    const tracks = player.textTracks();

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

    // @ts-ignore
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

    // PLYR-624 for some reason, only on DRM feeds, the -webkit-media-text-track-container appears in Chrome
    // It's needed for Safari, but if not Safari, we want to hide it.
    // The actual hiding is done in live-player.scss, but it's toggled based on this class.
    if (!isSafari) {
      if (context.hasDrmFeed) {
        playerEl.classList.add('hide-webkit-media-text-track-container');
      }
    }

    // -----------------------------------------------------
    // Get the current player's AudioTrackList object.
    // The list of Videojs-supported audio track labels can be found here: https://docs.videojs.com/tutorial-audio-tracks.html
    //@ts-ignore
    const audioTrackList = player.audioTracks();

    // /**
    //  * For DASH streams, AWS MediaPackage splits the audio from the video for DASH;
    //  * however, there is usually already a high-bitrate audio defined.
    //  * It appears to our client as two separate audio streams to choose from.
    //  * We are guaranteed the audio track ID/naming scheme by the videojs-contrib-dash plugin,
    //  * so we can simply filter out those "main" tracks that aren't `dash-audio-1`.
    //  */

    if (audioTrackList) {
      audioTrackList.on('addtrack', (e) => {
        // If the audio track is a 'main' track but not the first, it must be a duplicate. Remove it.
        if (e.track.label === 'eng' || e.track.label === 'Eng') {
          //@ts-ignore -- getTrackById is a method on VideoJS' extension of AudioTrackList.
          const changeTrack = audioTrackList.getTrackById(e.track.id);
          changeTrack.label = 'English';
        }
        if (e.track.id !== 'dash-audio-1' && e.track.kind === 'main') {
          //@ts-ignore -- getTrackById is a method on VideoJS' extension of AudioTrackList.
          const removeTrack = audioTrackList.getTrackById(e.track.id);
          audioTrackList.removeTrack(removeTrack);
        }
      });
    }

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
        }, 1000);
      }
    }

    // set audio/video robustness levels to a default for DASH streams
    // http://cdn.dashjs.org/v2.9.0/jsdoc/module-ProtectionController.html#setRobustnessLevel__anchor
    //@ts-ignore
    if (player.dash && player.dash.mediaPlayer) {
      player.dash.mediaPlayer
        .getProtectionController()
        .setRobustnessLevel('SW_SECURE_CRYPTO');
    }

    player.on('error', () => {
      handlePlayerError(player);
    });
  }, [context, handlePlayerError, isSafari]);

  // @TODO what we really need to do is fetch listings every minute inside this component and pass them down as props to the child components.
  const handleListingImage = (imageUrl: string): void => {
    const imageToUse = imageUrl || FALLBACK_LIVESTREAM_POSTER_IMAGE_URL;
    setVideoOptions((prev) => ({
      ...prev,
      poster: imageToUse,
    }));
  };

  useEffect(() => {
    if (
         context.features.pbs_internal_disable_geolocation_livestreams ||
         context.options?.unsafePBSInternalDisableGeolocationLivestreams
       ) {
      setLivestreamAvailability(LivestreamAvailability.success);
    } else {
      // on load, check the IP address
      checkAvailability();
    }

    // check if Geolocation API is even supported by their browser
    if (!navigator.geolocation) {
      throw new Error(locationRequest.geolocationNotSupported);
    }

    const livePlayerOptions = getLivePlayerOptions(context);
    const playerEl = document.querySelector('video');
    if (playerEl) {
      handlePlayerMount();
    }
    setVideoOptions(livePlayerOptions);

    // Intentionally only run on first mount
    // eslint-disable-next-line
  }, []);

  if (errorData) {
    return (
      <div className="wrapper wrapper--error">
        <ErrorOverlay errorData={errorData} />
      </div>
    );
  }

  if (!videoOptions) {
    return;
  }

  return (
    <div className="wrapper">
      <LivePlayerUIContainer
        livestreamAvailability={livestreamAvailability}
        context={context}
        checkGeolocation={checkGeolocation}
      />
      {
        // this outer div with `data-vjs-player` is necessary as to avoid
        // multiple video elements rendering, per
        // https://github.com/videojs/video.js/blob/master/docs/guides/react.md
      }
      {livestreamAvailability === LivestreamAvailability.success && (
        <div data-vjs-player>
          {
            // The user has passed the location checks and is ready to view the
            // livestream. We place the component here instead of LivePlayerUI because we want to tap into the videojs events for started/not-started.
          }
          {!context?.options?.channelSwitch === true && (
            <PosterOverlay
              stationCommonName={context.stationCommonName}
              stationLogo={context.stationLogo}
            />
          )}

          <LiveStreamPlayer
            {...videoOptions}
            mounted={handlePlayerMount}
            context={context}
          />

          {context?.options?.feedCid && (
            <MultiLivestreamOverlay
              context={context}
              handleListingImage={handleListingImage}
            />
          )}
        </div>
      )}
    </div>
  );
}

const LivePlayerContainer = connect()(LivePlayer);

export function renderPlayer(store: Store): void {
  const context = livePlayerContextBridgeToLivePlayerContext(
    window['livePlayerContextBridge']
  );

  const videoJsPlayer: Provider = (
    <Provider store={store}>
      <LivePlayerContainer context={context} />
    </Provider>
  );
  ReactDOM.render(videoJsPlayer, document.getElementById(elements.root));
}
