import isString from 'lodash-es/isString';

export const getParentUrl = (
  document_ = document,
  window_ = window
): string => {
  return document_.referrer || window_.location.href;
};

export const getParentOrigin = (
  document_ = document,
  window_ = window
): string => {
  const parentUrl = getParentUrl(document_, window_);
  const url = new URL(parentUrl);
  return url.origin;
};

export const sendParentPostMessage = (message: string): void => {
  const isInsideIframe =
    parent && parent.postMessage !== undefined && window.self !== window.top;
  if (isInsideIframe) {
    parent.postMessage(message, getParentOrigin());
  }
};

export const parseMessageData = (
  eventData: string
  // Let parseMessageData return "any" since the type varies so much
  // eslint-disable-next-line
): any => {
  let parsedData: string | unknown;

  if (!isString(eventData)) {
    return;
  }

  try {
    parsedData = JSON.parse(eventData);
  } catch {
    return;
  }

  return parsedData;
};
