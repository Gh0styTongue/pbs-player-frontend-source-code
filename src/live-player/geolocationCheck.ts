// wrapping geolocation request in a promise
// adapted from: https://gist.github.com/varmais/74586ec1854fe288d393
export const getDeviceLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    // get the long and lat coords through browser location prompt
    const options = {
      maximumAge: 86400000, // 1 day
      timeout: 20000,
    };
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};
