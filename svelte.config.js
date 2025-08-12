// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';
import { importAssets } from 'svelte-preprocess-import-assets'

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [importAssets(), preprocess()],

	kit: {
		paths: {
  base: process.env.NODE_ENV === 'production' ? '/trans-model-leg' : '',
           relative: false
		},
		appDir: 'app',

		adapter: adapter({
			pages: 'build',
			assets: 'build',
			strict: true
		})
	}
};

export default config;
