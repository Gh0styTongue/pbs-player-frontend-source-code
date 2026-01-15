const staticUrl: string = window['staticUrl'];

if (!staticUrl) {
  throw new Error('Missing global static url required for dynamic public path');
}

// Webpack's publicPath is an important variable for dynamic chunks
// as well as image imports, which we use commonly in this project.
// Because we use Cloudfront CDN, the value of publicPath depends on the
// deployment environment (QA/Staging/Production) and is not known at
// build time. To work around this, we set webpack's public path variable
// via a global variable injected by the django backend. Note that this
// shim is only included for production bundle, and should not be included
// for the development bundle.
// https://webpack.js.org/configuration/output/#output-publicpath
__webpack_public_path__ = `${staticUrl}build/`;
