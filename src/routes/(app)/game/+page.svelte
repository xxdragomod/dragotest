<svelte:head>
	<title>DRAGO • Game</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<link rel="preload" as="image" href="/assets/images/game-page-dragon.png" />
<link rel="preload" as="image" href="/assets/games/game_1.webp" />
	<link rel="preload" as="image" href="/assets/games/game_2.webp" />
	<link rel="preload" as="image" href="/assets/games/game_3.webp" />
<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar />

  <main class="sub-wrap">
    <section class="hero-section" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 1rem 1rem;text-align:center;">
      <img class="game-page-logo" src="/assets/images/game-page-dragon.png" alt="DRAGO dragon emblem" width="512" height="183" decoding="async" fetchpriority="high" onerror={(e) => (e.currentTarget.style.display = 'none')} />
      <h2 style="font-family:'Luckiest Guy',cursive;font-size:1.7rem;font-weight:400;letter-spacing:0.06em;color:#2a2116;margin:0;text-transform:uppercase;">DRAGO PREDICTOR</h2>
    </section>

    <section class="games-grid" id="gamesGrid" aria-label="Games">
      <div class="games-empty">Loading games…</div>
    </section>
  </main>

  <!-- Auto Bet Pro — floating action ball (bottom-right) -->
  <a href="/auto-bet/" class="fab" id="autoBetFab" aria-label="Auto Bet Pro" title="Auto Bet Pro">
    <img src="/assets/images/autobet-icon.png" alt="" draggable="false" />
  </a>

<style>
	.fab {
		position: fixed;
		right: 1.1rem;
		bottom: calc(78px + env(safe-area-inset-bottom, 0px));
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(145deg, #e8c65e, var(--gold, #c9a227));
		color: #2a2116;
		box-shadow: 0 6px 18px rgba(42, 33, 22, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.45);
		border: 2px solid rgba(255, 250, 242, 0.7);
		z-index: 70;
		text-decoration: none;
		transition: transform 0.15s ease;
	}
	.fab:active {
		transform: scale(0.92);
	}
	.fab img {
		width: 66%;
		height: 66%;
		object-fit: contain;
		pointer-events: none;
	}
</style>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/game-page.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/game__dashboard.js'),
			() => import('$lib/pages/game__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
