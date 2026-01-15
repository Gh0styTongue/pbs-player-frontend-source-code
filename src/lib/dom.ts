/**
 * Helper function for listening to document ready.
 * Taken from http://youmightnotneedjquery.com/
 */
export const ready = (callback: () => void): void => {
  if (
    document['attachEvent']
      ? document.readyState === 'complete'
      : document.readyState !== 'loading'
  ) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
};

export const exitFullScreen = (): void => {
  // Only exit fullscreen if there is an active element
  // that has requested fullscreen.
  const inFullScreen =
    document['fullscreenElement'] ||
    document['webkitFullscreenElement'] ||
    document['mozFullscreenElement'] ||
    document['msFullscreenElement'];
  if (inFullScreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document['webkitExitFullscreen']) {
      document['webkitExitFullscreen']();
    } else if (document['mozFullScreenElement']) {
      document['mozFullScreenElement']();
    } else if (document['msFullscreenElement']) {
      document['msExitFullscreen']();
    }
  }
};
