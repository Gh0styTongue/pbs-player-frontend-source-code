function getSentryDsn() {
  const sentryDsns = {
    'player.pbs.org':
      'https://9e599279d82441c2b48aedc7aa8d83ed@sentry.io/1465818',
    defaults: '',
  };
  return sentryDsns[window.location.host] || sentryDsns.defaults;
}

const DEV = location.hostname.includes('localhost');
const SENTRY_DSN = getSentryDsn();
const MUX_ENV_KEY = 'sh1cu4rhemjbphkph1bvpjsji';
const MUX_CUSTOM_DOMAIN = 'qoe.pbs.org';

const env = {
  DEV,
  SENTRY_DSN,
  MUX_ENV_KEY,
  MUX_CUSTOM_DOMAIN,
};

export default env;
