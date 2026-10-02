// Original pages ke <body class="..."> — Svelte 5 me <svelte:body> class allow nahi karta,
// isliye SSR/prerender time pe body tag me class inject karte hain.
// Isse class HTML me pehle se aati hai → koi FOUC / style flash nahi.
const BODY_CLASS = {
	'/auto-bet/': 'page-auto-bet',
	'/dashboard/': 'page-dashboard',
	'/chat/': 'page-chat',
	'/developer/': 'page-developer',
	'/game/': 'page-game',
	'/gameplay/': 'page-gameplay',
	'/notifications/': 'page-notifications',
	'/prediction/': 'page-prediction',
	'/profile/': 'profile-body-v2 page-profile',
	'/status/': 'page-status',
	'/subscription/': 'page-subscription'
};

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const cls = BODY_CLASS[event.url.pathname];
	if (!cls) return resolve(event);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<body', `<body class="${cls}"`)
	});
}
