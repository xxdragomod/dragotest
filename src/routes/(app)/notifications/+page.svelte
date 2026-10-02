<svelte:head>
	<title>DRAGO • Notifications</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&display=swap" rel="stylesheet" />
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<AppTopBar headerClass="notifications-top">
	<a class="notifications-back" slot="leading" href="/dashboard/" aria-label="Back to dashboard" title="Back to dashboard">
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="m14.5 5-7 7 7 7M8 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</a>
</AppTopBar>

<main class="notifications-main">
	<section class="notifications-empty-card" aria-labelledby="notifications-heading">
		<div class="notifications-empty-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none">
				<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M10 21h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
			</svg>
		</div>
		<span class="notifications-eyebrow">DRAGO UPDATES</span>
		<h2 id="notifications-heading">No notifications yet</h2>
		<p>New announcements and account updates will appear here.</p>
		<div class="notifications-feed" id="notificationFeed" aria-live="polite" aria-relevant="additions text"></div>
	</section>
</main>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/notifications-page.css';
	import { onMount } from 'svelte';

	onMount(() => {
		import('$lib/pages/dashboard__dashboard.js').catch((err) => {
			console.error('[DRAGO] notifications session check failed:', err);
		});
	});
</script>
