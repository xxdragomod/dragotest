<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	$: pathname = $page.url.pathname;
	$: isLogin = pathname === '/';

	// Keep navigation resets aligned with the browser document scroller.
	afterNavigate(({ from, to }) => {
		if (!from || from.url.pathname !== to.url.pathname) {
			requestAnimationFrame(() => window.scrollTo(0, 0));
		}
	});

	// Dialogs and drawers already lock body scrolling. Mirror that lock to the
	// root scrolling element now that pages scroll in the document again.
	onMount(() => {
		const syncScrollLock = () => {
			const locked =
				document.body.style.overflow === 'hidden' ||
				document.body.classList.contains('drawer-open') ||
				document.body.classList.contains('drawer-is-open');
			document.documentElement.classList.toggle('drago-scroll-locked', locked);
		};

		const observer = new MutationObserver(syncScrollLock);
		observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
		syncScrollLock();

		return () => {
			observer.disconnect();
			document.documentElement.classList.remove('drago-scroll-locked');
		};
	});
</script>

<div class="drago-viewport">
	<div class="drago-app-shell" class:login-frame={isLogin}>
		<slot />
	</div>
</div>

<style>
	:global(html) {
		width: 100%;
		height: auto !important;
		min-height: 100%;
		overflow-x: hidden !important;
		overflow-y: auto !important;
		overscroll-behavior-x: none;
	}

	:global(html.drago-scroll-locked) {
		overflow: hidden !important;
	}

	:global(body) {
		width: 100%;
		height: auto !important;
		min-height: 100vh;
		min-height: 100dvh;
		margin: 0;
		padding-top: 0 !important;
		padding-left: 0 !important;
		padding-right: 0 !important;
		display: block !important;
		overflow: visible !important;
	}

	.drago-viewport {
		width: 100%;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: stretch;
		justify-content: center;
		background: #9698a6;
	}

	.drago-app-shell {
		position: relative;
		flex: 0 1 430px;
		width: 100%;
		max-width: 430px;
		min-width: 0;
		min-height: 100vh;
		min-height: 100dvh;
		background: #fff;
		box-shadow: 0 0 30px rgba(23, 25, 37, 0.16);
	}

	/* Shared headers used to break out to the browser viewport before the app
	   frame existed. Keep them edge-to-edge within the centered app column. */
	:global(.drago-app-shell .app-topbar),
	:global(.drago-app-shell .dash-top) {
		width: 100% !important;
		max-width: 100% !important;
		margin-left: 0 !important;
		margin-right: 0 !important;
		box-sizing: border-box;
	}

	/* The fixed tab bar must track the centered frame, not the full desktop width. */
	:global(.drago-app-shell .nav) {
		left: calc(50% - 215px) !important;
		right: auto !important;
		width: 430px !important;
	}

	/* Fixed quick actions and drawers should stay inside the same app column. */
	@media (min-width: 431px) {
		:global(.drago-app-shell .side-drawer) {
			left: calc(50% - 215px) !important;
		}

		:global(.drago-app-shell .webview-full) {
			left: calc(50% - 215px) !important;
			right: auto !important;
			width: 430px !important;
		}

		:global(.drago-app-shell .fab) {
			right: calc(50% - 215px + 1.1rem) !important;
		}

		:global(.drago-app-shell .float-ball) {
			right: calc(50% - 215px + 1rem) !important;
		}
	}

	/* Preserve the original full-width mobile layout and anchor controls to the
	   phone viewport instead of any page-content wrapper. */
	@media (max-width: 430px) {
		.drago-viewport {
			background: #fff;
		}

		.drago-app-shell {
			flex-basis: 100%;
			max-width: none;
			box-shadow: none;
		}

		:global(.drago-app-shell .nav) {
			left: 0 !important;
			right: 0 !important;
			width: auto !important;
		}
	}

	/* Keep the login screen centered on tall phones, but top-start it on short
	   ones so the hero and button can be reached by scrolling. */
	.drago-app-shell.login-frame {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px 20px 56px;
		background: var(--bg, #f2e9db);
	}

	:global(.drago-app-shell.login-frame .wrap) {
		flex: 0 0 auto;
		width: 100%;
	}

	@media (max-height: 620px) {
		.drago-app-shell.login-frame {
			justify-content: flex-start;
		}
	}
</style>
