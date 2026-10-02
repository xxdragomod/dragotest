<svelte:head>
	<title>DRAGO PREDICTOR — WinGo 30s Live Prediction</title>
	<meta
		name="description"
		content="DRAGO PREDICTOR delivers real-time WinGo 30s live prediction powered by the AI-driven RX1 model. Track WinGo 30 second predictions, live results and detailed prediction history in one fast, mobile-friendly app."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://dragopredictor.vercel.app/" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="DRAGO PREDICTOR" />
	<meta property="og:title" content="DRAGO PREDICTOR — WinGo 30s Live Prediction" />
	<meta
		property="og:description"
		content="Real-time WinGo 30s live prediction with the AI-powered RX1 model, live results and prediction history."
	/>
	<meta property="og:url" content="https://dragopredictor.vercel.app/" />
	<meta property="og:image" content="https://dragopredictor.vercel.app/assets/images/login-hero.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="DRAGO PREDICTOR — WinGo 30s Live Prediction" />
	<meta
		name="twitter:description"
		content="Real-time WinGo 30s live prediction with the AI-powered RX1 model, live results and prediction history."
	/>
	<meta name="twitter:image" content="https://dragopredictor.vercel.app/assets/images/login-hero.png" />

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<div class="wrap">
	<h1 class="sr-only">DRAGO PREDICTOR — WinGo 30s Live Prediction</h1>
	<div class="hero">
		<img
			src="/assets/images/login-hero.png"
			alt="DRAGO PREDICTOR — WinGo 30s Live Prediction app"
			width="320"
			height="320"
			fetchpriority="high"
			decoding="async"
		/>
	</div>

	<div class="tagline">
		<span id="typeText"></span>
	</div>

	<button class="google-btn" id="googleBtn" type="button">
		Get Started
	</button>

	<div class="error" id="errorBox"></div>
</div>

<style>
	/* SEO H1 sirf Google/screen-readers ke liye — visually hidden, login UI bilkul clean */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

<script>
	import '$lib/css/styles.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// original index.html wala inline script — image copy/drag block
		const onCtx = (e) => {
			if (e.target && (e.target.tagName === 'IMG' || e.target.closest('img'))) e.preventDefault();
		};
		const onDrag = (e) => {
			if (e.target && e.target.tagName === 'IMG') e.preventDefault();
		};
		document.addEventListener('contextmenu', onCtx, true);
		document.addEventListener('dragstart', onDrag, true);

		// original script.js — verbatim
		await import('$lib/pages/login.js');

		return () => {
			document.removeEventListener('contextmenu', onCtx, true);
			document.removeEventListener('dragstart', onDrag, true);
		};
	});
</script>
