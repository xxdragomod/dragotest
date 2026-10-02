<svelte:head>
	<title>DRAGO • Auto Bet Pro</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<AppTopBar>
	<a slot="leading" href="/game/" class="back-link" aria-label="Back to games">
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M15 18l-6-6 6-6" />
		</svg>
	</a>
</AppTopBar>

<svelte:window on:keydown={handlePageKeydown} />

{#if showBrowserNotice}
	<div class="browser-overlay">
		<dialog open class="browser-dialog" aria-modal="true" aria-labelledby="browser-dialog-title" aria-describedby="browser-dialog-copy">
			<button class="dialog-close" type="button" aria-label="Close Kiwi Browser guide" on:click={dismissBrowserNotice}>×</button>
			<div class="dialog-art">
				<img src="/assets/images/autobet-kiwi/dragon-logo.png" alt="DRAGO dragon logo" />
			</div>
			<p class="dialog-eyebrow">DRAGO AUTO BET PRO</p>
			<h2 id="browser-dialog-title">Kiwi Browser setup</h2>
			<p id="browser-dialog-copy" class="dialog-copy">Auto Bet Pro is installed from Kiwi Browser’s Extensions page. Download Kiwi from its official release, then open DRAGO in Kiwi to follow the picture guide.</p>
			<p class="legacy-warning"><b>Security note:</b> Kiwi is archived and no longer receives security updates. If you choose to use it, download only from the official GitHub release.</p>
			<a class="dialog-primary" href="https://github.com/kiwibrowser/src.next/releases/tag/14310011181" target="_blank" rel="noopener noreferrer">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>
				Download Kiwi Browser
			</a>
			<button class="dialog-continue" type="button" on:click={dismissBrowserNotice}>Continue to setup guide</button>
		</dialog>
	</div>
{/if}

<main class="autobet-page">
	<header class="page-hero">
		<div class="hero-icon"><img src="/assets/images/autobet-icon.png" alt="" /></div>
		<p class="eyebrow">DRAGO GAME TOOLS</p>
		<h1>Auto Bet Pro</h1>
		<p class="hero-copy">Kiwi Browser mein install karo, signal aur stake check karke khud start ya stop karo.</p>
	</header>

	{#if $gate.state === 'loading'}
		<section class="access-strip checking" aria-live="polite" aria-label="Checking access">
			<span class="access-dot pulse" aria-hidden="true"></span>
			<span><b>Checking DRAGO access</b><small>Download unlocks after your account is verified.</small></span>
			<span class="status-tag">CHECKING</span>
		</section>
	{:else if $gate.state === 'error'}
		<section class="access-strip access-error" aria-live="polite" aria-label="Access check error">
			<span class="access-icon" aria-hidden="true">!</span>
			<span><b>Could not verify access</b><small>Auto Bet stays locked until your account check succeeds.</small></span>
			<button class="status-action" type="button" on:click={checkAccess}>Retry</button>
		</section>
	{:else if $gate.state === 'locked'}
		<section class="access-strip access-locked" aria-live="polite" aria-label="Pro plan required">
			<span class="access-icon" aria-hidden="true">⌑</span>
			<span><b>Eligible Pro plan required</b><small>{#if $gate.plan === 'test'}Auto Bet isn’t included with your current plan.{:else}Your plan does not include Auto Bet Pro yet.{/if}</small></span>
			<a class="status-action" href="/subscription/">View plans</a>
		</section>
	{:else}
		<section class="access-strip access-active" aria-live="polite" aria-label="Pro access active">
			<span class="access-dot" aria-hidden="true"></span>
			<span><b>Access active</b><small>{$gate.planLabel} · verified by DRAGO</small></span>
			<span class="status-tag active-tag">READY</span>
		</section>
	{/if}

	<section class="script-card" id="download" aria-labelledby="script-title">
		<div class="script-window-head">
			<div class="window-dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<div class="script-title-wrap"><h2 id="script-title">Auto Bet Pro</h2><span>.USER.JS · V7.0</span></div>
			{#if $gate.state === 'ok'}
				<a class="download-button" href="/autobet-pro.user.js" download="DRAGO-AutoBet-Pro.user.js" aria-label="Download Auto Bet Pro script">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>
					Download
				</a>
			{:else if $gate.state === 'locked'}
				<a class="download-button locked-button" href="/subscription/">Unlock</a>
			{:else}
				<span class="download-button pending-button">Checking…</span>
			{/if}
		</div>
		<div class="script-preview">
			<div class="script-preview-top"><span class="prompt-mark">&gt;</span><b>DRAGO AUTO BET PRO</b><span class="script-version">v7.0.0</span></div>
			<div class="script-features">
				<div><span class="feature-check">✓</span><span>Install once from Kiwi Extensions</span></div>
				<div><span class="feature-check">✓</span><span>Eligible DRAGO plan is verified in gameplay</span></div>
				<div><span class="feature-check">✓</span><span>You control START and STOP</span></div>
			</div>
			<div class="script-file"><span class="file-mark" aria-hidden="true">JS</span><code>DRAGO-AutoBet-Pro.user.js</code><span class="file-size">USER SCRIPT</span></div>
		</div>
	</section>

	<section class="howto" id="how-to" aria-labelledby="how-title">
		<header class="section-heading">
			<div class="heading-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>
			</div>
			<div><p class="eyebrow">KIWI BROWSER · PHOTO GUIDE</p><h2 id="how-title">How to install & use</h2></div>
		</header>

		<div class="guide-list">
			<article class="guide-row">
				<div class="guide-visual"><span class="guide-number">1</span><img src="/assets/images/autobet-kiwi/flow-ext-menu.png" alt="Kiwi Browser menu with Extensions highlighted" /></div>
				<div class="guide-copy"><span class="guide-kicker">OPEN MENU</span><h3>Right-side 3 dots tap karo</h3><p>Kiwi page ke top-right <b>⋮</b> menu kholo, phir <b>Extensions</b> chuno.</p></div>
			</article>

			<article class="guide-row reverse">
				<div class="guide-visual"><span class="guide-number">2</span><img src="/assets/images/autobet-kiwi/flow-ext-dev.png" alt="Kiwi Browser Extensions page with Developer mode switch" /></div>
				<div class="guide-copy"><span class="guide-kicker">EXTENSIONS</span><h3>Developer mode ON karo</h3><p>Extensions page par <b>Developer mode</b> ka switch on kar do.</p></div>
			</article>

			<article class="guide-row">
				<div class="guide-visual"><span class="guide-number">3</span><img src="/assets/images/autobet-kiwi/step-open-drago.svg" alt="DRAGO Auto Bet Pro page open in Kiwi Browser" /></div>
				<div class="guide-copy"><span class="guide-kicker">DRAGO PAGE</span><h3>Web page par wapas aao</h3><p>Kiwi ke address bar se DRAGO Auto Bet Pro page kholo; zarurat ho to DRAGO mein sign in karo.</p></div>
			</article>

			<article class="guide-row reverse">
				<div class="guide-visual"><span class="guide-number">4</span><img src="/assets/images/autobet-kiwi/step-download.svg" alt="Auto Bet Pro download button and script file" /></div>
				<div class="guide-copy"><span class="guide-kicker">DOWNLOAD</span><h3>Script download karo</h3><p>Upar wale box mein <b>Download</b> tap karo. <code>DRAGO-AutoBet-Pro.user.js</code> file save hogi.</p></div>
			</article>

			<article class="guide-row">
				<div class="guide-visual"><span class="guide-number">5</span><img src="/assets/images/autobet-kiwi/flow-ext-import.png" alt="Kiwi Extensions page with the plus import button highlighted" /></div>
				<div class="guide-copy"><span class="guide-kicker">ADD SCRIPT</span><h3>Extensions mein + tap karo</h3><p>Extensions page par wapas jao aur <b>+ (from .zip/.crx/.user.js)</b> button tap karo.</p></div>
			</article>

			<article class="guide-row reverse">
				<div class="guide-visual"><span class="guide-number">6</span><img src="/assets/images/autobet-kiwi/step-install-finish.svg" alt="Select the DRAGO userscript and enable Auto Bet Pro" /></div>
				<div class="guide-copy"><span class="guide-kicker">FINISH SETUP</span><h3>File add karke extension ON karo</h3><p>Downloads se file choose karke install confirm karo, phir <b>Auto Bet Pro</b> toggle ON karo.</p></div>
			</article>
		</div>

		<p class="use-note"><b>Use:</b> Kiwi mein DRAGO sign in karke Game se supported WinGo 30s kholo. Period, signal, balance aur stake check karke hi <b>START</b> dabao; <b>STOP</b> se rok sakte ho. Real bets lose ho sakte hain.</p>
	</section>
</main>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const BROWSER_NOTICE_KEY = 'drago_autobet_kiwi_notice_v1';
	const gate = writable({ state: 'loading', plan: null, planLabel: '' });
	let showBrowserNotice = false;

	function dismissBrowserNotice() {
		showBrowserNotice = false;
		try { sessionStorage.setItem(BROWSER_NOTICE_KEY, '1'); } catch (e) {}
	}

	function handlePageKeydown(event) {
		if (event.key === 'Escape' && showBrowserNotice) dismissBrowserNotice();
	}

	function checkAccess() {
		gate.set({ state: 'loading', plan: null, planLabel: '' });
		const token = sessionStorage.getItem('drago_token');
		const expiry = sessionStorage.getItem('drago_token_expiry');
		if (!token || (expiry && Number(expiry) < Date.now())) {
			try {
				sessionStorage.removeItem('drago_token');
				sessionStorage.removeItem('drago_token_expiry');
				sessionStorage.removeItem('drago_user');
			} catch (e) {}
			window.location.replace('../');
			return;
		}

		fetch('/api/account', {
			headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
			cache: 'no-store',
			credentials: 'same-origin'
		})
			.then(async (response) => {
				if (response.status === 401) {
					window.DRAGO_SEC?.clearSession?.();
					window.location.replace('../');
					return null;
				}
				if (!response.ok) throw new Error('http ' + response.status);
				return response.json();
			})
			.then((data) => {
				if (!data?.success || !data.user) throw new Error('bad response');
				const user = data.user;
				const plan = String(user.pro_plan || '').trim().toLowerCase();
				const autoBetAllowed = data.entitlements?.auto_bet === true || user.auto_bet_allowed === true;
				if (user.is_pro && autoBetAllowed && ['beginners', 'profit'].includes(plan)) {
					gate.set({ state: 'ok', plan, planLabel: user.plan_label || 'Pro' });
				} else if (user.is_pro) {
					gate.set({ state: 'locked', plan: plan || 'test', planLabel: user.plan_label || 'Pro' });
				} else {
					gate.set({ state: 'locked', plan: 'free', planLabel: 'Free' });
				}
			})
			.catch(() => gate.set({ state: 'error', plan: null, planLabel: '' }));
	}

	onMount(() => {
		try { showBrowserNotice = sessionStorage.getItem(BROWSER_NOTICE_KEY) !== '1'; } catch (e) { showBrowserNotice = true; }
		checkAccess();
	});
</script>

<style>
	:global(body.page-auto-bet) { --ab-ink:#2a2116; --ab-gold:#c9a227; --ab-muted:#716b62; }
	:global(html) { scroll-behavior:smooth; }
	.back-link { display:flex; align-items:center; justify-content:center; width:2.2rem; height:2.2rem; border-radius:.7rem; color:var(--ab-ink,#2a2116); text-decoration:none; }
	.autobet-page { max-width:34rem; margin:0 auto; padding:.65rem 1rem calc(6.3rem + env(safe-area-inset-bottom,0px)); color:var(--ab-ink,#2a2116); }
	.page-hero { display:flex; flex-direction:column; align-items:center; text-align:center; padding:.25rem .25rem .8rem; }
	.hero-icon { width:2.85rem; height:2.85rem; display:grid; place-items:center; border-radius:.95rem; background:linear-gradient(145deg,#fff5d7,#f1e1a7); border:1px solid rgba(201,162,39,.3); box-shadow:0 5px 13px rgba(61,47,19,.09); }
	.hero-icon img { width:2rem; height:2rem; object-fit:contain; }
	.eyebrow { margin:0 0 .18rem; color:#9b7a26; font:800 .61rem/1.2 Inter,system-ui,sans-serif; letter-spacing:.15em; text-transform:uppercase; }
	.page-hero .eyebrow { margin-top:.6rem; }
	.page-hero h1 { margin:0; color:var(--ab-ink,#2a2116); font:400 1.65rem/1.1 'Luckiest Guy',system-ui,sans-serif; letter-spacing:.045em; text-transform:uppercase; }
	.hero-copy { max-width:22rem; margin:.38rem 0 0; color:var(--ab-muted,#716b62); font:500 .82rem/1.45 Inter,system-ui,sans-serif; }

	.access-strip { display:flex; align-items:center; gap:.62rem; margin:.2rem 0 .75rem; padding:.62rem .74rem; border:1px solid #e9e3d7; border-radius:.9rem; background:#fff; box-shadow:0 4px 13px rgba(42,33,22,.035); }
	.access-strip > span:nth-child(2) { min-width:0; flex:1; }
	.access-strip b,.access-strip small { display:block; }
	.access-strip b { color:#383229; font:800 .74rem/1.2 Inter,system-ui,sans-serif; }
	.access-strip small { margin-top:.13rem; color:#7a746b; font:500 .64rem/1.35 Inter,system-ui,sans-serif; }
	.access-dot { width:.56rem; height:.56rem; flex:0 0 auto; border-radius:50%; background:#34a36d; box-shadow:0 0 0 4px rgba(50,163,106,.12); }
	.access-dot.pulse { background:#d0a529; box-shadow:0 0 0 4px rgba(201,162,39,.13); animation:status-pulse 1.4s ease-in-out infinite; }
	@keyframes status-pulse { 50% { box-shadow:0 0 0 7px rgba(201,162,39,.04); } }
	.status-tag { flex:0 0 auto; padding:.32rem .45rem; border-radius:999px; background:#f7f3e8; color:#876819; font:800 .55rem/1 Inter,system-ui,sans-serif; letter-spacing:.06em; }
	.active-tag { color:#2a7b4e; background:#eaf5ed; }
	.access-active { border-color:#dbeadf; background:#fbfefb; }
	.access-locked { border-color:#f1dfba; background:#fffaf0; }
	.access-error { border-color:#f1d7d3; background:#fffaf9; }
	.access-icon { width:1.42rem; height:1.42rem; flex:0 0 auto; display:grid; place-items:center; border-radius:50%; background:#f6e9c7; color:#795d14; font:900 .85rem/1 Inter,system-ui,sans-serif; }
	.access-error .access-icon { background:#f7e4e1; color:#a64035; }
	.status-action { flex:0 0 auto; padding:.42rem .58rem; border:0; border-radius:.55rem; background:#302719; color:#fffaf0; font:800 .61rem/1 Inter,system-ui,sans-serif; text-decoration:none; cursor:pointer; }

	.script-card { margin:.7rem 0 1.15rem; overflow:hidden; border:1px solid #554526; border-radius:1.05rem; background:#211910; box-shadow:0 9px 22px rgba(42,33,22,.19); }
	.script-window-head { display:flex; align-items:center; gap:.55rem; min-height:3.15rem; padding:.58rem .68rem; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.035); }
	.window-dots { display:flex; align-items:center; gap:.27rem; flex:0 0 auto; }
	.window-dots span { width:.52rem; height:.52rem; border-radius:50%; }
	.window-dots span:nth-child(1) { background:#e4604c; }.window-dots span:nth-child(2) { background:#e2ac43; }.window-dots span:nth-child(3) { background:#63a96a; }
	.script-title-wrap { min-width:0; flex:1; display:flex; flex-direction:column; gap:.1rem; }
	.script-title-wrap h2 { overflow:hidden; margin:0; color:#f7e8bb; font:800 .72rem/1.15 Inter,system-ui,sans-serif; text-overflow:ellipsis; white-space:nowrap; }
	.script-title-wrap span { color:#ad9c77; font:700 .49rem/1 Inter,system-ui,sans-serif; letter-spacing:.08em; }
	.download-button { display:inline-flex; align-items:center; justify-content:center; gap:.28rem; flex:0 0 auto; min-height:1.95rem; padding:.45rem .68rem; border:0; border-radius:999px; background:linear-gradient(135deg,#f0d26d,#c9a227); color:#2a2116; font:800 .64rem/1 Inter,system-ui,sans-serif; text-decoration:none; cursor:pointer; box-shadow:0 3px 10px rgba(0,0,0,.15); }
	.locked-button { padding-right:.8rem; padding-left:.8rem; background:#53472d; color:#f5e8c5; }
	.pending-button { background:#514832; color:#e2d5b0; box-shadow:none; }
	.script-preview { padding:.83rem .92rem .9rem; }
	.script-preview-top { display:flex; align-items:center; gap:.42rem; color:#d8c17b; font:700 .67rem/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; }
	.prompt-mark { color:#f0d26d; font-size:.9rem; }
	.script-version { margin-left:auto; color:#8e836b; font-size:.58rem; }
	.script-features { display:grid; gap:.43rem; margin:.72rem 0 .72rem; padding-left:.12rem; }
	.script-features > div { display:flex; align-items:center; gap:.45rem; color:#e4ddcf; font:500 .67rem/1.35 Inter,system-ui,sans-serif; }
	.feature-check { width:.92rem; height:.92rem; flex:0 0 auto; display:grid; place-items:center; border-radius:50%; background:rgba(103,169,111,.17); color:#91d197; font:900 .58rem/1 Inter,system-ui,sans-serif; }
	.script-file { display:flex; align-items:center; gap:.48rem; padding:.48rem .56rem; border:1px solid rgba(255,255,255,.09); border-radius:.62rem; background:rgba(255,255,255,.045); }
	.file-mark { width:1.35rem; height:1.35rem; flex:0 0 auto; display:grid; place-items:center; border-radius:.37rem; background:#ead38b; color:#332713; font:900 .55rem/1 ui-monospace,monospace; }
	.script-file code { min-width:0; overflow:hidden; color:#f6edda; font:600 .61rem/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; text-overflow:ellipsis; white-space:nowrap; }
	.file-size { margin-left:auto; flex:0 0 auto; color:#9b8e73; font:700 .48rem/1 Inter,system-ui,sans-serif; letter-spacing:.06em; }

	.howto { margin:1.05rem 0 0; }
	.section-heading { display:flex; align-items:center; gap:.68rem; margin:0 0 .82rem; }
	.heading-icon { width:2.4rem; height:2.4rem; flex:0 0 auto; display:grid; place-items:center; border-radius:.78rem; background:#f7efd9; color:#876719; }
	.heading-icon svg { width:1.25rem; height:1.25rem; }
	.section-heading .eyebrow { margin:0 0 .12rem; font-size:.54rem; }
	.section-heading h2 { margin:0; color:#30291d; font:400 1.05rem/1.15 'Lilita One',Inter,system-ui,sans-serif; letter-spacing:.015em; }
	.guide-list { position:relative; display:flex; flex-direction:column; gap:.4rem; padding:.1rem 0 .1rem; }
	.guide-list::before { position:absolute; top:1.2rem; bottom:1.2rem; left:50%; width:3px; border-radius:3px; background:#e9d79f; content:''; transform:translateX(-50%); }
	.guide-row { position:relative; z-index:1; display:flex; align-items:center; gap:.72rem; min-height:7.7rem; padding:.22rem 0; }
	.guide-row.reverse { flex-direction:row-reverse; }
	.guide-visual { position:relative; flex:0 0 57%; overflow:hidden; border:2px solid #fff; border-radius:.93rem; background:#f7f1df; box-shadow:0 5px 15px rgba(42,33,22,.12); }
	.guide-visual img { display:block; width:100%; height:auto; }
	.guide-number { position:absolute; z-index:2; top:.45rem; left:.45rem; width:1.58rem; height:1.58rem; display:grid; place-items:center; border:2px solid #fffaf0; border-radius:50%; background:linear-gradient(145deg,#f2dc86,#c9a227); color:#2a2116; font:900 .75rem/1 Inter,system-ui,sans-serif; box-shadow:0 3px 8px rgba(42,33,22,.22); }
	.guide-copy { min-width:0; flex:1; }
	.guide-row.reverse .guide-copy { text-align:right; }
	.guide-kicker { display:block; margin-bottom:.22rem; color:#9b7a26; font:800 .5rem/1.2 Inter,system-ui,sans-serif; letter-spacing:.13em; }
	.guide-copy h3 { margin:0; color:#332c20; font:800 .78rem/1.28 Inter,system-ui,sans-serif; }
	.guide-copy p { margin:.25rem 0 0; color:#716b62; font:500 .67rem/1.45 Inter,system-ui,sans-serif; }
	.guide-copy p b { color:#494131; font-weight:800; }
	.guide-copy code { padding:.06rem .17rem; border-radius:.2rem; background:#f6f3ec; color:#615638; font-size:.61rem; }
	.use-note { margin:.82rem 0 0; padding:.15rem .12rem; color:#726a5d; font:500 .69rem/1.5 Inter,system-ui,sans-serif; }
	.use-note b { color:#4b3a12; font-weight:800; }

	.browser-overlay { position:fixed; inset:0; z-index:2000; display:flex; align-items:center; justify-content:center; padding:1.1rem; background:rgba(37,31,22,.52); backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px); animation:overlay-in .22s ease both; }
	.browser-dialog { position:relative; width:min(100%,23rem); max-height:min(90vh,47rem); overflow:auto; margin:0; padding:1.05rem 1.2rem 1.1rem; border:1px solid #e8deca; border-radius:1.35rem; background:#fff; color:#2a2116; box-shadow:0 24px 70px rgba(22,18,12,.31); text-align:center; animation:dialog-in .35s cubic-bezier(.2,.8,.2,1) both; }
	.dialog-close { position:absolute; z-index:2; top:.7rem; right:.7rem; width:2rem; height:2rem; display:grid; place-items:center; border:1px solid #eee7d9; border-radius:.7rem; background:rgba(255,255,255,.92); color:#544a37; font:600 1.25rem/1 Inter,system-ui,sans-serif; cursor:pointer; }
	.dialog-art { display:grid; place-items:center; width:8.7rem; height:8.7rem; margin:.1rem auto .3rem; overflow:hidden; border:1px solid #f0e6cf; border-radius:50%; background:linear-gradient(145deg,#fff,#fffaf0); box-shadow:0 8px 24px rgba(42,33,22,.1); }
	.dialog-art img { display:block; width:100%; height:100%; object-fit:contain; }
	.dialog-eyebrow { margin:.28rem 0 .2rem; color:#9b7a26; font:800 .58rem/1.2 Inter,system-ui,sans-serif; letter-spacing:.15em; }
	.browser-dialog h2 { margin:0; color:#2a2116; font:400 1.35rem/1.15 'Lilita One',Inter,system-ui,sans-serif; }
	.dialog-copy { max-width:19rem; margin:.48rem auto .55rem; color:#6f695e; font:500 .75rem/1.5 Inter,system-ui,sans-serif; }
	.legacy-warning { margin:.2rem 0 .75rem; color:#8a5d18; font:600 .62rem/1.45 Inter,system-ui,sans-serif; }
	.legacy-warning b { color:#704c15; }
	.dialog-primary { width:100%; min-height:2.7rem; display:flex; align-items:center; justify-content:center; gap:.45rem; border:1px solid #b99229; border-radius:.78rem; background:linear-gradient(135deg,#f1d779,#c9a227); color:#2a2116; font:800 .75rem/1.2 Inter,system-ui,sans-serif; text-decoration:none; box-shadow:0 5px 13px rgba(128,96,20,.16); }
	.dialog-continue { margin-top:.58rem; padding:.45rem .5rem; border:0; background:none; color:#827966; font:700 .64rem/1.2 Inter,system-ui,sans-serif; cursor:pointer; }
	@keyframes overlay-in { from { opacity:0; } to { opacity:1; } }
	@keyframes dialog-in { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }

	@media (max-width:380px) {
		.autobet-page { padding-right:.75rem; padding-left:.75rem; }
		.guide-row { gap:.55rem; }
		.guide-visual { flex-basis:55%; }
		.guide-copy h3 { font-size:.72rem; }
		.guide-copy p { font-size:.61rem; }
	}
	@media (prefers-reduced-motion:reduce) {
		:global(html) { scroll-behavior:auto; }
		*,*::before,*::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; }
	}
</style>
