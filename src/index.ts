import 'preact/devtools';
import { ready } from './lib/dom';
import { createReduxStore } from './store';
import { renderPlayer } from './player/player';
import { renderPlayer as renderLivePlayer } from './live-player/live-player';
import env from './environment';
import * as Sentry from '@sentry/browser';

import 'normalize.css/normalize.css';
import './styles/index.scss';

Sentry.init({
  dsn: env.SENTRY_DSN,
  sampleRate: 0.5,
  allowUrls: [/player\.pbs\.org/],
  ignoreErrors: [
    /ResizeObserver loop limit exceeded/,
    /ResizeObserver loop completed with undelivered notifications/,
    // the next two are from a plugin that plauges sentry
    /currentTarget, detail, isTrusted, target/,
    /Non-Error promise rejection captured with keys: currentTarget, detail, isTrusted, target/,
    // These errors happen on the partner player has autplay set to true, but the browser rejects it
    // which, in this case, it should. It still gets reported as an error.
    /NotAllowedError: play\(\) failed because the user didn't interact with the document first. https:\/\/goo.gl\/xX8pDD/,
    /NotAllowedError: play\(\) can only be initiated by a user gesture./,
    /(Error:\s)?AbortError: The play\(\) request was interrupted by a call to pause\(\).\(\s\)?\(https:\/\/goo.gl\/LdLk22\)?/,
    // This error happens in huge numbers seems to happen either when a) a user pauses an ad,
    // or b) a post to mux fails. Both only happen in Safari, and we can't do much about it.
    /AbortError: The operation was aborted./,
    // These come from fetch requests being stopped manually before they complete
    // https://forum.sentry.io/t/typeerror-failed-to-fetch-reported-over-and-overe/8447/2
    /TypeError: cancelled/,
    /TypeError: NetworkError when attempting to fetch resource./,
    /SecurityError: The operation is insecure./,
    /SecurityError: Permission denied to access property "dispatchEvent" on cross-origin object/,
    /TypeError: undefined is not an object \(evaluating 'this.player.tech\(\{IWillNotUseThisInPlugins:!0\}\).hls'\)/,
    /TypeError: Unable to get property 'vhs' of undefined or null reference/,
    /TypeError: undefined is not an object \(evaluating 'this.player.tech\(\{IWillNotUseThisInPlugins:!0\}\).vhs'\)/,
    /TypeError: Cannot convert 'this.player.tech\(\{IWillNotUseThisInPlugins:!0\}\)' to object/,
    /this.player.tech\(...\) is undefined/,
    /Cannot read property 'hls' of undefined/,
    /Cannot read property 'vhs' of undefined/,
    /undefined is not an object \(evaluating 'e.tech_.el_'\)/,
    /e.tech_ is undefined/,
    // likely thrown by a bug in videojs/http-streaming
    /InvalidStateError: Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' \(was 'arraybuffer'\)./,
    // PLYR-445: the following four errors get reported if the user has an ad blocker.
    // The video still plays, which is expected. So, we're filtering out these errors.
    /google is not defined/,
    /Can't find variable: google/,
    /'google' is undefined/,
    /'google' is not defined/,
    /google.ima.ImaSdkSettings is undefined/,
    /SyntaxError: bad trailing UTF-8 byte/,
    /SyntaxError: bad trailing UTF-8 byte 0xE5 doesn't match the pattern 0b10xxxxxx/,
    /Non-Error promise rejection captured with value:/,
    /UnhandledRejection: Non-Error promise rejection captured with value:/,
    /Non-Error promise rejection captured with keys: http_code, message, status, url/,
    /Cannot read property 'el_' of undefined/,
    /Fullscreen request denied/,
    /TypeError: Permissions check failed/,
    /jwplayer is not defined/,
    /undefined is not an object \(evaluating 'ceCurrentVideo.currentTime'\)/,
    /null is not an object \(evaluating 'ceCurrentVideo.currentTime'\)/,
    // PLYR-849 filtering weird new relic error spike
    /Loading chunk 692 failed/,
    // Weird splintered sentry issue that keeps popping up with Electron
    /Failed to construct 'Worker'/,
  ],
  tracesSampleRate: 0.25,
});

function loadPolyfill(callback, errCallback) {
  // This is a conditional check to load polyfills
  // on older browsers, without forcing modern browsers to also
  // download the extra bits. It loosely follows the following article:
  // https://philipwalton.com/articles/loading-polyfills-only-when-needed/

  const isModernBrowser: boolean =
    window['Promise'] &&
    window['fetch'] &&
    window['Symbol'] &&
    window['URLSearchParams'] &&
    window.navigator !== undefined;

  if (isModernBrowser) {
    return callback();
  }

  import(/* webpackChunkName: "polyfill" */ './polyfill')
    .then(() => {
      callback();
    })
    .catch((err) => errCallback(err));
}

function main() {
  // Forking our Player (Viral, Partner, etc.) from LivePlayer
  if (window['livePlayerContextBridge']) {
    ready(function onReady() {
      renderLivePlayer(createReduxStore());
    });
  } else {
    ready(function onReady() {
      renderPlayer(createReduxStore());
    });
  }
}

function handleHotModuleReloads() {
  // this is a development only function to handle webpack's HMR chunks.
  // HMR is useful to live-reloading css updates, but can be quite disruptive to
  // video playback. So for now, we configure it to accept only
  // css chunks and dispose the Javascript chunks.
  if (module.hot) {
    const disposed: any = undefined; // eslint-disable-line
    module.hot.dispose(disposed);
  }
}

try {
  loadPolyfill(main, (err) => {
    if (err) {
      Sentry.captureException(err);
    } else {
      handleHotModuleReloads();
    }
  });
} catch (e) {
  Sentry.captureException(e);
}
