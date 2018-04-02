const postcss = require('@stencil/postcss');
const autoprefixer = require('autoprefixer');

exports.config = {
  namespace: 'simple-web-components',
  outputTargets: [
	{ type: 'www' },
	{ type: 'dist' }
  ],
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
