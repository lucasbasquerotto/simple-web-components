const sass = require('@stencil/sass');

exports.config = {
  namespace: 'simple-web-components',
  generateDistribution: true,
  serviceWorker: false,
  enableCache: false,
  plugins: [
    sass()
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}
