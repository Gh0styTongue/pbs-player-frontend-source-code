/**
 * Convert http url to https url
 */
export const adjustProtocol = (
  url: string,
  protocol = window.location.protocol
): string => {
  const source = new URL(url);
  if (protocol === 'https:') {
    source.protocol = 'https:';
  }

  return source.toString();
};
