<script>
	import { page } from '$app/stores';
	import { onMount, tick } from 'svelte';

	$: pathname = $page.url.pathname;
	$: isHome = pathname === '/dashboard/' || pathname === '/dashboard';
	$: isGames = ['/game/', '/gameplay/', '/auto-bet/'].some((route) => pathname === route || pathname.startsWith(route));
	$: isMy = pathname === '/profile/' || pathname === '/profile';
	$: isPrediction = pathname === '/prediction/' || pathname === '/prediction';
	$: isChat = pathname === '/chat/' || pathname === '/chat';

	let vipSheetOpen = false;
	let vipTab = 'pro';
	let vipDuration = 'monthly';
	let vipCheckoutNotice = false;
	let centerButton;
	let closeButton;
	let previousBodyOverflow = '';
	let bodyScrollLocked = false;

	function lockPageScroll() {
		if (typeof document === 'undefined' || bodyScrollLocked) return;
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		bodyScrollLocked = true;
	}

	function restorePageScroll() {
		if (typeof document === 'undefined' || !bodyScrollLocked) return;
		document.body.style.overflow = previousBodyOverflow;
		bodyScrollLocked = false;
	}

	function selectVipDuration(duration) {
		vipDuration = duration;
		vipCheckoutNotice = false;
	}

	function handleVipContinue() {
		// Checkout is intentionally not wired until a payment flow is provided.
		vipCheckoutNotice = true;
	}

	async function openVipSheet(event) {
		// Keep the original /prediction/ href usable for opening in another tab.
		if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
		event?.preventDefault();
		if (vipSheetOpen) return;
		vipCheckoutNotice = false;
		lockPageScroll();
		vipSheetOpen = true;
		await tick();
		closeButton?.focus();
	}

	async function closeVipSheet() {
		if (!vipSheetOpen) return;
		vipSheetOpen = false;
		restorePageScroll();
		await tick();
		centerButton?.focus();
	}

	function handleDialogKeys(event) {
		if (!vipSheetOpen) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeVipSheet();
			return;
		}
		if (event.key !== 'Tab') return;

		const focusable = Array.from(document.querySelectorAll('.vip-sheet button:not([disabled]), .vip-sheet a[href]'));
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleDialogKeys);
		return () => {
			window.removeEventListener('keydown', handleDialogKeys);
			restorePageScroll();
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Acme&family=Lilita+One&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<nav class="nav" aria-label="Main navigation">
	<div class="notch" aria-hidden="true">
		<svg viewBox="0 0 128 44" xmlns="http://www.w3.org/2000/svg">
			<path fill="var(--bar)" stroke="none" d="M0 0H19C26.5 0 31 4.2 31 10.5A33.5 33.5 0 0 0 97 10.5C97 4.2 101.5 0 109 0H128V44H0Z" />
		</svg>
	</div>

	<div class="tabs">
		<a href="/dashboard/" class="tab" class:active={isHome} aria-current={isHome ? 'page' : undefined}>
			<img class="ic off" src="/assets/nav/home-off.png" alt="" aria-hidden="true" />
			<img class="ic on" src="/assets/nav/home-on.png" alt="" aria-hidden="true" />
			<span>Home</span>
		</a>
		<a href="/game/" class="tab" class:active={isGames} aria-current={isGames ? 'page' : undefined}>
			<img class="ic off" src="/assets/nav/games-off.png" alt="" aria-hidden="true" />
			<img class="ic on" src="/assets/nav/games-on.png" alt="" aria-hidden="true" />
			<span>Games</span>
		</a>
		<span class="tab-spacer" aria-hidden="true"></span>
		<a href="/chat/" class="tab" class:active={isChat} aria-current={isChat ? 'page' : undefined} aria-label="Open NEXUS AI chat">
			<img class="ic off" src="/assets/nav/chat-off.png" alt="" aria-hidden="true" />
			<img class="ic on" src="/assets/nav/chat-on.png" alt="" aria-hidden="true" />
			<span>Chat</span>
		</a>
		<a href="/profile/" class="tab" class:active={isMy} aria-current={isMy ? 'page' : undefined}>
			<img class="ic off" src="/assets/nav/my-off.png" alt="" aria-hidden="true" />
			<img class="ic on" src="/assets/nav/my-on.png" alt="" aria-hidden="true" />
			<span>My</span>
		</a>
	</div>

	<a
		bind:this={centerButton}
		href="/prediction/"
		class="sub"
		aria-label="Open prediction and plan options"
		title="Prediction / Scan"
		aria-haspopup="dialog"
		aria-controls="vipSheet"
		aria-expanded={vipSheetOpen}
		aria-current={isPrediction ? 'page' : undefined}
		onclick={openVipSheet}
	>
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<g fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round">
				<path d="M4.6 9.2 8.5 12 12 6.6 15.5 12l3.9-2.8-1.4 8H6Z" />
				<rect x="5.6" y="18.9" width="12.8" height="2.1" rx="1.05" stroke="none" />
			</g>
			<g fill="#fff">
				<circle cx="4.1" cy="8" r="1.7" />
				<circle cx="12" cy="5" r="1.8" />
				<circle cx="19.9" cy="8" r="1.7" />
			</g>
			<g fill="#ffc82a">
				<path d="M12 12.4 13.5 14.4 12 16.4 10.5 14.4Z" />
				<circle cx="8.3" cy="15" r=".85" />
				<circle cx="15.7" cy="15" r=".85" />
			</g>
		</svg>
	</a>
</nav>

{#if vipSheetOpen}
	<div class="vip-modal" role="presentation">
		<button class="vip-backdrop" type="button" aria-label="Close plan panel" tabindex="-1" onclick={closeVipSheet}></button>
		<div class="vip-sheet" id="vipSheet" role="dialog" aria-modal="true" aria-labelledby="vipTitle" tabindex="-1">
			<div class="vip-sheet-scroll">
				<div class="vip-toolbar">
					<button bind:this={closeButton} class="vip-close" type="button" aria-label="Close plan panel" onclick={closeVipSheet}>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					</button>
					<div class="vip-handle" aria-hidden="true"></div>
					<span class="vip-toolbar-balance" aria-hidden="true"></span>
				</div>

				<header class="vip-heading">
					<img class="vip-title-mark" src="/assets/images/vip-dragon-mark.png" alt="" aria-hidden="true" />
					<h1 id="vipTitle">DRAGO VIP</h1>
				</header>

				<div class="vip-tabs" role="tablist" aria-label="Membership type">
					<button
						id="vip-tab-basic"
						class="vip-tab"
						class:vip-tab-active={vipTab === 'basic'}
						type="button"
						role="tab"
						aria-selected={vipTab === 'basic'}
						aria-controls="vip-panel-basic"
						tabindex={vipTab === 'basic' ? 0 : -1}
						onclick={() => (vipTab = 'basic')}
					>FREE</button>
					<button
						id="vip-tab-pro"
						class="vip-tab"
						class:vip-tab-active={vipTab === 'pro'}
						type="button"
						role="tab"
						aria-selected={vipTab === 'pro'}
						aria-controls="vip-panel-pro"
						tabindex={vipTab === 'pro' ? 0 : -1}
						onclick={() => (vipTab = 'pro')}
					>Pro VIP</button>
				</div>

				{#if vipTab === 'pro'}
					<div class="vip-panel" id="vip-panel-pro" role="tabpanel" aria-labelledby="vip-tab-pro">
						<article class="vip-offer-card">
							<div class="vip-card-cover">
								<div class="vip-cover-label">PREMIUM ACCESS</div>
							</div>
							<div class="vip-offer-content">
								<div class="vip-card-title-row">
									<div>
										<h2>Pro VIP</h2>
										<p>4 premium features included</p>
									</div>
									<span class="vip-available-tag">PRO</span>
								</div>

								<ul class="vip-features">
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>Unlimited Prediction</span></li>
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>Floating window in game</span></li>
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>Unlimited use of NEXUS AGENT</span></li>
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>Unlimited DRAGO API access</span></li>
								</ul>
								<p class="vip-api-note">API limit: 20 requests per minute per endpoint</p>
							</div>
						</article>

						<section class="vip-pricing-section" aria-labelledby="vip-duration-title">
							<div class="vip-duration-heading">
								<h3 id="vip-duration-title">Choose duration</h3>
								<p>Save 50% with either option</p>
							</div>
							<div class="vip-duration-options" role="group" aria-label="Pro VIP plan prices">
								<button class="vip-duration-card vip-duration-weekly" class:vip-duration-selected={vipDuration === 'weekly'} type="button" aria-pressed={vipDuration === 'weekly'} aria-label="Select weekly duration" onclick={() => selectVipDuration('weekly')}>
									<span class="vip-duration-meta"><span class="vip-duration-name">Weekly</span></span>
									<span class="vip-duration-price">₹749</span>
									<span class="vip-daily-cost">≈ ₹107/day</span>
								</button>
								<button class="vip-duration-card vip-duration-monthly" class:vip-duration-selected={vipDuration === 'monthly'} type="button" aria-pressed={vipDuration === 'monthly'} aria-label="Select monthly duration" onclick={() => selectVipDuration('monthly')}>
									<span class="vip-save-pill">SAVE 50%</span>
									<span class="vip-duration-meta"><span class="vip-duration-name">Monthly</span></span>
									<span class="vip-duration-price">₹1,498</span>
									<span class="vip-daily-cost">≈ ₹50/day</span>
								</button>
							</div>

							<button class="vip-continue-action" class:vip-continue-weekly={vipDuration === 'weekly'} class:vip-continue-monthly={vipDuration === 'monthly'} type="button" onclick={handleVipContinue}>
								Continue with plan <strong>{vipDuration === 'weekly' ? '₹749' : '₹1,498'}</strong>
							</button>
							{#if vipCheckoutNotice}
								<p class="vip-checkout-note" role="status">Checkout isn’t connected yet.</p>
							{/if}
							<div class="vip-trust-row" aria-label="Account and plan assurances">
								<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-3 7.7-7 10-4-2.3-7-5.4-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 12.2 2.2 2.2 4.8-4.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>100% Secure</span>
								<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>Instant Active</span>
								<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h3v6H5a2 2 0 0 1-2-2v-4Zm18 0h-3v6h1a2 2 0 0 0 2-2v-4ZM17 19a5 5 0 0 1-5 3h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>24×7 Support</span>
							</div>
						</section>
					</div>
				{:else}
					<div class="vip-panel" id="vip-panel-basic" role="tabpanel" aria-labelledby="vip-tab-basic">
						<article class="vip-offer-card vip-basic-card">
							<div class="vip-card-cover">
								<div class="vip-cover-label">FREE ACCESS</div>
							</div>
							<div class="vip-offer-content">
								<div class="vip-card-title-row">
									<div>
										<h2>Basic</h2>
										<p>2 included · 2 Pro-only</p>
									</div>
									<span class="vip-available-tag">FREE</span>
								</div>

								<ul class="vip-features">
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>3 predictions from the normal server</span></li>
									<li><span class="vip-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span><span>10 Developer API history uses</span></li>
									<li class="is-locked"><span class="vip-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span>Floating window in game</span><span class="vip-feature-state">PRO</span></li>
									<li class="is-locked"><span class="vip-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span>Unlimited use of NEXUS AGENT</span><span class="vip-feature-state">PRO</span></li>
								</ul>
							</div>
						</article>

						<a class="vip-verify-action" href="/profile/">
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-3 7.7-7 10-4-2.3-7-5.4-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 12.2 2.2 2.2 4.8-4.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
							<span>Verify Your Account</span>
							<span class="vip-verify-arrow" aria-hidden="true">→</span>
						</a>

						<div class="vip-trust-row" aria-label="Account and plan assurances">
							<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-3 7.7-7 10-4-2.3-7-5.4-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 12.2 2.2 2.2 4.8-4.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>100% Secure</span>
							<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>Instant Active</span>
							<span class="vip-trust-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h3v6H5a2 2 0 0 1-2-2v-4Zm18 0h-3v6h1a2 2 0 0 0 2-2v-4ZM17 19a5 5 0 0 1-5 3h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>24×7 Support</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		padding-bottom: calc(78px + env(safe-area-inset-bottom, 0px)) !important;
	}

	.nav {
		--page: #ffffff;
		--bar: #f5f5f5;
		--line: #eeeeee;
		--label: #9b9b9b;
		--label-active: #222222;
		--bar-h: 62px;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		height: calc(var(--bar-h) + env(safe-area-inset-bottom, 0px));
		padding-bottom: env(safe-area-inset-bottom, 0px);
		isolation: isolate;
	}

	.nav::before,
	.nav::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: calc(50% - 63px);
		background: var(--bar);
		border-top: 1px solid var(--line);
	}

	.nav::before {
		left: 0;
	}

	.nav::after {
		right: 0;
	}

	.notch {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 128px;
		transform: translateX(-50%);
		background: linear-gradient(var(--bar), var(--bar)) 0 43px / 100% 100% no-repeat;
		border: 0;
		outline: none;
		box-shadow: none;
		pointer-events: none;
	}

	.notch svg {
		display: block;
		width: 128px;
		height: 44px;
		border: 0;
		outline: none;
		box-shadow: none;
	}

	.tabs {
		position: relative;
		z-index: 1;
		height: var(--bar-h);
		display: grid;
		grid-template-columns: repeat(5, 1fr);
	}

	.tab {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 9px;
		gap: 3px;
		text-decoration: none;
		color: var(--label);
		font-size: 12px;
		line-height: 14px;
		-webkit-tap-highlight-color: transparent;
	}

	.tab .ic {
		width: 25px;
		height: 25px;
		object-fit: contain;
	}

	.tab .on {
		display: none;
	}

	.tab.active {
		color: var(--label-active);
		font-weight: 500;
	}

	.tab.active .on {
		display: block;
	}

	.tab.active .off {
		display: none;
	}

	.tab:focus-visible {
		outline: 2px solid #222;
		outline-offset: 2px;
		border-radius: 8px;
	}

	.sub:focus-visible {
		outline: 2px solid #222;
		outline-offset: 3px;
		border-radius: 50%;
	}

	.tab-spacer {
		display: block;
	}

	.sub {
		position: absolute;
		z-index: 2;
		left: 50%;
		top: -23px;
		width: 56px;
		height: 56px;
		transform: translateX(-50%);
		border: 0;
		border-radius: 50%;
		outline: none;
		box-shadow: none;
		cursor: pointer;
		padding: 0;
		background: linear-gradient(180deg, #ffdb68, #ffc30c);
		display: grid;
		place-items: center;
		transition: transform 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.sub:active {
		transform: translateX(-50%) scale(0.94);
	}

	.sub svg {
		width: 34px;
		height: 34px;
		display: block;
	}

	.vip-modal {
		--vip-display: 'Lilita One', 'Arial Rounded MT Bold', cursive, sans-serif;
		--vip-body: 'Acme', 'Trebuchet MS', sans-serif;
		--vip-ink: #2a2116;
		--vip-muted: #6f6758;
		--vip-rx1-bg: #fff9e8;
		--vip-rx1-line: #f5df9c;
		--vip-rx1-accent: #dda900;
		--vip-nexus-bg: #eaf8ef;
		--vip-nexus-line: #b9e8c8;
		--vip-nexus-accent: #35ae67;
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 8px 12px 0;
		box-sizing: border-box;
		font-family: var(--vip-body);
	}

	.vip-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: rgba(24, 22, 17, 0.48);
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
		cursor: default;
		animation: vipFadeIn 180ms ease-out both;
	}

	.vip-sheet {
		position: relative;
		z-index: 1;
		width: min(100%, 460px);
		height: min(78vh, 700px);
		height: min(78dvh, 700px);
		max-height: calc(100dvh - 8px - env(safe-area-inset-top, 0px));
		min-height: min(480px, 70dvh);
		border-radius: 20px 20px 0 0;
		background: #fff;
		color: var(--vip-ink);
		box-shadow: 0 22px 64px rgba(33, 27, 15, 0.24);
		overflow: hidden;
		animation: vipSheetRise 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
		outline: none;
	}

	.vip-sheet-scroll {
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 6px 10px 18px;
		scrollbar-width: none;
	}

	.vip-sheet-scroll::-webkit-scrollbar { display: none; }

	.vip-handle {
		grid-column: 2;
		grid-row: 1;
		justify-self: center;
		width: 29px;
		height: 4px;
		border-radius: 999px;
		background: #e8e3d5;
	}

	.vip-toolbar {
		display: grid;
		grid-template-columns: 1fr 42px 1fr;
		align-items: center;
		min-height: 34px;
		margin-bottom: 1px;
	}

	.vip-close {
		grid-column: 1;
		grid-row: 1;
		justify-self: start;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: #5d6577;
		cursor: pointer;
		transition: transform 150ms ease, color 150ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.vip-close:active { transform: scale(0.94); }
	.vip-close svg { width: 23px; height: 23px; }
	.vip-toolbar-balance { grid-column: 3; grid-row: 1; }

	.vip-heading {
		text-align: center;
		padding: 0 4px 10px;
	}

	.vip-title-mark {
		display: block;
		width: min(210px, 76%);
		height: auto;
		margin: 0 auto;
		object-fit: contain;
	}

	.vip-heading h1 {
		margin: 2px 0 0;
		color: #5d6577;
		font: 400 clamp(29px, 8vw, 36px)/1.05 var(--vip-display);
		letter-spacing: 0.005em;
	}

	.vip-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding: 3px;
		margin: 0 0 7px;
		border: 1px solid #eceff2;
		border-radius: 11px;
		background: #f1f4f7;
	}

	.vip-tab {
		min-height: 33px;
		border: 1px solid transparent;
		border-radius: 8px;
		background: transparent;
		color: #746d5e;
		font: 400 13px/1 var(--vip-display);
		letter-spacing: 0.01em;
		cursor: pointer;
		transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.vip-tab-active {
		background: #fff;
		box-shadow: 0 2px 8px rgba(68, 55, 29, 0.08);
	}

	#vip-tab-basic.vip-tab-active {
		border-color: var(--vip-nexus-accent);
		color: #278b4e;
	}

	#vip-tab-pro.vip-tab-active {
		border-color: var(--vip-nexus-accent);
		color: #278b4e;
	}

	.vip-panel { animation: vipPanelIn 220ms ease-out both; }

	.vip-offer-card {
		border: 1px solid var(--vip-rx1-line);
		border-radius: 22px;
		background: #fff;
		box-shadow: 0 7px 22px rgba(58, 47, 24, 0.075);
		overflow: hidden;
	}

	.vip-basic-card { border-color: var(--vip-nexus-line); }

	.vip-card-cover {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		height: 45px;
		padding: 8px 11px;
		overflow: hidden;
		background: linear-gradient(112deg, #fff1c5 0%, var(--vip-rx1-bg) 48%, var(--vip-nexus-bg) 100%);
	}

	.vip-card-cover::before,
	.vip-card-cover::after {
		content: '';
		position: absolute;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		pointer-events: none;
	}

	.vip-card-cover::before {
		left: -58px;
		top: -78px;
		background: rgba(221, 169, 0, 0.14);
	}

	.vip-card-cover::after {
		right: 24px;
		bottom: -98px;
		background: rgba(53, 174, 103, 0.11);
	}

	.vip-basic-card .vip-card-cover {
		background: linear-gradient(112deg, #dff3e5 0%, var(--vip-nexus-bg) 62%, var(--vip-rx1-bg) 100%);
	}

	.vip-cover-label {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		padding: 5px 8px;
		border: 1px solid rgba(255, 255, 255, 0.85);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.82);
		color: #8d6b12;
		font: 400 9px/1 var(--vip-body);
		letter-spacing: 0.085em;
	}

	.vip-basic-card .vip-cover-label { color: #278b4e; }

	.vip-offer-content { padding: 10px 11px 12px; }

	.vip-card-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin: 0 0 8px;
	}

	.vip-card-title-row h2 {
		margin: 0;
		color: var(--vip-ink);
		font: 400 18px/1.08 var(--vip-display);
		letter-spacing: 0.01em;
	}

	.vip-card-title-row p {
		margin: 3px 0 0;
		color: var(--vip-muted);
		font: 400 11px/1.3 var(--vip-body);
	}

	.vip-available-tag {
		flex: 0 0 auto;
		padding: 6px 9px;
		border: 1px solid var(--vip-nexus-line);
		border-radius: 999px;
		background: var(--vip-nexus-bg);
		color: #278b4e;
		font: 400 9px/1 var(--vip-body);
		letter-spacing: 0.04em;
	}

	.vip-basic-card .vip-available-tag {
		border-color: var(--vip-rx1-line);
		background: var(--vip-rx1-bg);
		color: #9b7500;
	}

	.vip-features {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin: 0;
		padding: 0;
	}

	.vip-features li {
		min-height: 35px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 5px 8px;
		border: 1px solid #efece4;
		border-radius: 11px;
		background: #fff;
		color: var(--vip-ink);
		font: 400 13px/1.28 var(--vip-body);
	}

	.vip-features li > span:nth-child(2) { flex: 1; min-width: 0; }
	.vip-features li:nth-child(odd) { border-color: #f1e4ba; }
	.vip-features li:nth-child(even) { border-color: #d8ebdc; }
	.vip-basic-card .vip-features li { border-color: #d8ebdc; }
	.vip-basic-card .vip-features li:nth-child(even) { border-color: #f1e4ba; }

	.vip-check,
	.vip-lock {
		flex: 0 0 20px;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.vip-check { background: #fff2c8; color: #aa8000; }
	.vip-features li:nth-child(even) .vip-check { background: #e3f3e7; color: #278b4e; }
	.vip-basic-card .vip-features li .vip-check { background: #e3f3e7; color: #278b4e; }
	.vip-basic-card .vip-features li:nth-child(even) .vip-check { background: #fff2c8; color: #aa8000; }
	.vip-check svg { width: 12px; height: 12px; }

	.vip-lock {
		background: #f0f2f5;
		color: #89909b;
	}

	.vip-lock svg { width: 12px; height: 12px; }

	.vip-features li.is-locked,
	.vip-basic-card .vip-features li.is-locked {
		border-color: #e7e9ed;
		background: #f8f9fa;
		color: #838a94;
	}

	.vip-feature-state {
		flex: 0 0 auto;
		padding: 4px 6px;
		border-radius: 999px;
		background: #edf0f3;
		color: #757d89;
		font: 400 8px/1 var(--vip-body);
		letter-spacing: 0.04em;
	}

	.vip-api-note {
		margin: 9px 0 0;
		padding: 7px 10px;
		border: 1px solid var(--vip-rx1-line);
		border-radius: 10px;
		background: var(--vip-rx1-bg);
		color: #746139;
		font: 400 12px/1.3 var(--vip-body);
		text-align: left;
	}

	.vip-pricing-section { padding: 0 1px 12px; }

	.vip-duration-heading { margin: 13px 0 10px; text-align: center; }

	.vip-duration-heading h3 {
		margin: 0;
		color: var(--vip-ink);
		font: 400 23px/1.08 var(--vip-display);
		letter-spacing: 0.01em;
	}

	.vip-duration-heading p {
		margin: 4px 0 0;
		color: var(--vip-muted);
		font: 400 13px/1.25 var(--vip-body);
	}

	.vip-duration-options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin: 0;
	}

	.vip-duration-card {
		position: relative;
		min-width: 0;
		min-height: 136px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 17px 8px 8px;
		border: 2px solid #e1e7ef;
		border-radius: 22px;
		background: #f8fafc;
		color: #141b2d;
		font-family: 'Outfit', var(--vip-body), sans-serif;
		text-align: center;
		cursor: pointer;
		transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.vip-duration-card:active { transform: scale(0.985); }

	.vip-duration-weekly.vip-duration-selected {
		border: 3px solid var(--vip-rx1-accent);
		background: #fffdf7;
		box-shadow: 0 6px 18px rgba(221, 169, 0, 0.12);
	}

	.vip-duration-monthly {
		padding-top: 21px;
		border-color: #e1e7ef;
		background: #fff;
	}

	.vip-duration-monthly.vip-duration-selected {
		border: 3px solid #7959ee;
		background: #fff;
		box-shadow: 0 6px 16px rgba(121, 89, 238, 0.11);
	}

	.vip-duration-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		min-height: 23px;
		white-space: nowrap;
	}

	.vip-duration-name {
		color: #64748b;
		font: 600 18px/1.15 'Outfit', var(--vip-body), sans-serif;
		letter-spacing: 0.01em;
	}

	.vip-duration-monthly .vip-duration-name { color: #141b2d; }

	.vip-duration-price {
		color: #141b2d;
		font: 700 clamp(27px, 7.2vw, 32px)/1 'Outfit', var(--vip-body), sans-serif;
		letter-spacing: -0.04em;
	}

	.vip-save-pill {
		position: absolute;
		top: -11px;
		left: 50%;
		transform: translateX(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 13px;
		border: 0;
		border-radius: 999px;
		background: linear-gradient(105deg, #7659ef 0%, #a333e8 100%);
		color: #fff;
		font: 700 10px/1 'Outfit', var(--vip-body), sans-serif;
		letter-spacing: 0.045em;
		white-space: nowrap;
		box-shadow: 0 3px 8px rgba(121, 89, 238, 0.16);
	}

	.vip-daily-cost {
		width: 100%;
		padding: 8px 4px;
		border-radius: 11px;
		background: #f0f3f8;
		color: #64748b;
		font: 600 clamp(13px, 3.8vw, 15px)/1 'Outfit', var(--vip-body), sans-serif;
		white-space: nowrap;
	}

	.vip-duration-monthly .vip-daily-cost {
		background: #f2edff;
		color: #7959ee;
	}

	.vip-continue-action {
		width: 100%;
		min-height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		margin: 13px 0 0;
		padding: 0 16px;
		border: 0;
		border-radius: 15px;
		color: #fff;
		font: 400 16px/1 var(--vip-body);
		cursor: pointer;
		transition: transform 150ms ease, box-shadow 150ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.vip-continue-action strong { font: 400 19px/1 var(--vip-display); }
	.vip-continue-action:active { transform: scale(0.985); }
	.vip-continue-weekly { background: linear-gradient(105deg, #d6a000, #c18d00); box-shadow: 0 6px 16px rgba(221, 169, 0, 0.2); }
	.vip-continue-monthly { background: linear-gradient(105deg, #7659ef, #a333e8); box-shadow: 0 6px 16px rgba(121, 89, 238, 0.2); }

	.vip-checkout-note {
		margin: 8px 0 0;
		color: var(--vip-muted);
		font: 400 12px/1.3 var(--vip-body);
		text-align: center;
	}

	.vip-verify-action {
		width: 100%;
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		margin: 12px 0 0;
		padding: 0 15px;
		border: 1px solid var(--vip-nexus-accent);
		border-radius: 14px;
		background: linear-gradient(105deg, #35ae67, #278b4e);
		color: #fff;
		font: 400 16px/1 var(--vip-display);
		text-decoration: none;
		box-shadow: 0 5px 14px rgba(53, 174, 103, 0.2);
		-webkit-tap-highlight-color: transparent;
	}

	.vip-verify-action svg { width: 18px; height: 18px; flex: 0 0 18px; }
	.vip-verify-arrow { font: 400 18px/1 var(--vip-display); }

	.vip-trust-row {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
		margin: 12px 0 2px;
	}

	.vip-trust-item {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 6px 8px;
		border: 1px solid var(--vip-nexus-line);
		border-radius: 999px;
		background: #f4fbf6;
		color: #278b4e;
		font: 400 10px/1 var(--vip-body);
		white-space: nowrap;
	}

	.vip-trust-item svg { width: 13px; height: 13px; flex: 0 0 13px; }

	.vip-trust-item:nth-child(2) {
		border-color: var(--vip-rx1-line);
		background: var(--vip-rx1-bg);
		color: #9b7500;
	}

	.vip-trust-item:nth-child(3) {
		border-color: #ded5ff;
		background: #f6f2ff;
		color: #7156dc;
	}

	.vip-close:focus-visible,
	.vip-tab:focus-visible,
	.vip-duration-card:focus-visible,
	.vip-continue-action:focus-visible,
	.vip-verify-action:focus-visible {
		outline: 2px solid var(--vip-ink);
		outline-offset: 3px;
	}

	@keyframes vipFadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes vipSheetRise {
		from { opacity: 0; transform: translateY(22px) scale(0.99); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
	@keyframes vipPanelIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

	@media (max-width: 380px) {
		.vip-modal { padding-left: 9px; padding-right: 9px; }
		.vip-sheet-scroll { padding-right: 11px; padding-left: 11px; }
		.vip-duration-options { gap: 7px; }
		.vip-duration-card { min-height: 128px; padding: 14px 5px 7px; }
		.vip-duration-monthly { padding-top: 18px; }
		.vip-duration-meta { min-height: 21px; gap: 3px; }
		.vip-duration-name { font-size: 18px; }
		.vip-duration-price { font-size: 25px; }
		.vip-save-pill { padding: 5px 10px; font-size: 9px; }
		.vip-daily-cost { padding: 7px 2px; font-size: 12px; }
		.vip-continue-action { min-height: 47px; font-size: 15px; }
		.vip-continue-action strong { font-size: 18px; }
		.vip-features li { font-size: 12px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.vip-backdrop, .vip-sheet, .vip-panel { animation-duration: 1ms; }
		.vip-close, .vip-tab, .vip-duration-card, .vip-continue-action { transition: none; }
	}
</style>
