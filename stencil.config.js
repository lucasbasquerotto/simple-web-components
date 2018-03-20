const postcss = require('@stencil/postcss');
const autoprefixer = require('autoprefixer');

exports.config = {
  namespace: 'simple-web-components',
  generateDistribution: true,
  serviceWorker: false,
  enableCache: false,
  plugins: [
    postcss({
		plugins: [
			autoprefixer()
		],		
	})
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}
