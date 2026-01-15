import { UrsData } from '../lib/urs';
import { adjustProtocol } from '../lib/url';

export const isSourceLive = (data: UrsData[]): boolean => {
  let isLive = false;
  const livestreamCDNs = ['ga.live.cdn.pbs.org', 'pbs.lls.cdn.pbs.org'];
  data
    .filter((d) => d.url)
    .map((d) => {
      const sourceURL: string = adjustProtocol(d.url || '');
      const parseURL: URL = new URL(sourceURL);
      // detect if this is a one-off livestream. if so, return true
      if (livestreamCDNs.includes(parseURL.hostname)) {
        isLive = true;
      }
    });
  return isLive;
};
