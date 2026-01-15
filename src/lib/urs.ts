import { Video } from '../bridge';
import jsonp from 'jsonp';

export interface UrsData {
  url?: string;
  status?: string;
  message?: string;
}

// eslint-disable-next-line
export function getUrsData(video: Video): Promise<any[]> {
  return Promise.all(video.encodings.map(getJsonP));
}

/**
 * Promise version of jsonp request to URS
 */
export const getJsonP = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    jsonp(url + '?format=jsonp', (err, data) => {
      if (err) {
        return reject(err);
      }

      if (data.status === 'error') {
        return reject(data);
      }

      resolve(data);
    });
  });
};
