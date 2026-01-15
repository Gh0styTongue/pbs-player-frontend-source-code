export const _isUAMobileSafari = (ua: string): boolean => {
  // taken as-is from https://coderwall.com/p/ktrbhq/detect-mobile-safari
  return /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(ua); // eslint-disable-line
};

export const _isUASafari = (ua: string): boolean => {
  // taken as-is from https://stackoverflow.com/a/23522755
  return /^((?!chrome|android).)*safari/i.test(ua);
};

export const isSafari = (): boolean => {
  return _isUASafari(navigator.userAgent);
};

// Checks for WebKit, excludes Chromium, but includes all iOS devices
export const isWebKit = (): boolean => {
  const ua = navigator.userAgent;
  // Chromium-based desktop browsers are the only browsers
  // that pretend to be WebKit-based but aren't.
  return (
    (/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) ||
    /\b(iPad|iPhone|iPod)\b/.test(ua)
  );
};

export const isMobileSafari = (): boolean => {
  return _isUAMobileSafari(navigator.userAgent);
};

export const _isUAAndroid = (ua: string): boolean => {
  return ua.toLowerCase().indexOf('android') > -1;
};

export const isAndroid = (): boolean => {
  return _isUAAndroid(navigator.userAgent);
};

export const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    //@ts-ignore
    navigator.msMaxTouchPoints > 0
  );
};
