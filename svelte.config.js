import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            pages: 'docs',
            assets: 'docs',
            fallback: "index.html",
            strict: false
        }),
        paths: {
            base: '/trans-model-leg', // Ensure this matches your repository name
        }
    }
};

export default config;
