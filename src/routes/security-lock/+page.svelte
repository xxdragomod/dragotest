<svelte:head>
	<title>Access Restricted — DRAGO</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap" rel="stylesheet" />
	<style>
		* { box-sizing: border-box; -webkit-user-select: none; user-select: none; }
		html, body {
			margin: 0; min-height: 100%;
			background: #ffffff;
			font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
			color: #2a2116;
		}
		.wrap {
			min-height: calc(100dvh - 50px);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1.5rem;
		}
		.card {
			width: 100%;
			max-width: 22rem;
			background: #fffaf2;
			border: 1px solid #e4d6bf;
			border-radius: 1.25rem;
			padding: 1.75rem 1.35rem;
			text-align: center;
			box-shadow: 0 12px 40px rgba(90,60,20,0.12);
		}
		.icon {
			width: 64px; height: 64px; margin: 0 auto 1rem;
			border-radius: 50%;
			background: rgba(185, 28, 28, 0.1);
			display: flex; align-items: center; justify-content: center;
			font-size: 1.75rem;
		}
		h1 {
			margin: 0 0 0.5rem;
			font-size: 1.2rem;
			font-weight: 800;
			letter-spacing: 0.02em;
		}
		p {
			margin: 0 0 0.75rem;
			font-size: 0.9rem;
			font-weight: 600;
			color: #8a7860;
			line-height: 1.5;
		}
		.btn {
			display: inline-block;
			margin-top: 0.5rem;
			padding: 0.85rem 1.25rem;
			border-radius: 0.85rem;
			background: linear-gradient(135deg, #c9a227, #a07f1a);
			color: #fff;
			font-weight: 800;
			text-decoration: none;
			border: none;
			cursor: pointer;
			font-size: 0.9rem;
		}
	</style>
</svelte:head>

<AppTopBar brandHref="/" />

<div class="wrap">
	<div class="card">
		<div class="icon">🛡</div>
		<h1>Developer tools blocked</h1>
		<p>This app does not allow browser developer tools. Close DevTools completely, then continue.</p>
		<p style="font-size:0.8rem;opacity:0.85">For support: Telegram @xx_drago</p>
		<a class="btn" id="goHome" href="/">Back to app</a>
	</div>
</div>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import { onMount } from 'svelte';

	onMount(() => {
		// Stay on this page while tools appear open
		var THRESH = 180;
		function openish() {
			var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
			if (coarse) return false;
			var dw = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
			var dh = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
			return dw > THRESH || dh > THRESH;
		}
		const goHome = document.getElementById('goHome');
		const onClick = function (e) {
			if (openish()) {
				e.preventDefault();
				alert('Close Developer Tools first, then try again.');
			}
		};
		goHome.addEventListener('click', onClick);
		return () => goHome.removeEventListener('click', onClick);
		// No app scripts loaded here — nothing useful to inspect
	});
</script>
