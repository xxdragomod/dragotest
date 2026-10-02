import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ runtime: 'nodejs24.x' }),
		prerender: {
			// gameplay page pe <iframe src="about:blank"> hai (game webview placeholder).
			// Prerender crawler usse link samajhta hai — ignore karo.
			handleHttpError: ({ path }) => path.startsWith('/about:')
		}
	}
};

export default config;
