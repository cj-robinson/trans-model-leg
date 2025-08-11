import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dsv from '@rollup/plugin-dsv';

export default defineConfig({
	plugins: [sveltekit(), dsv()],
	assetsInclude: ['**/*.csv', '**/*.txt'],
	build: {
		rollupOptions: {
			external: [
				'ai2html-output/trans_map-full.png',
				'ai2html-output/trans_map-medium.png',
				'ai2html-output/trans_map-mobile.png'
			]
		}
	}
});
