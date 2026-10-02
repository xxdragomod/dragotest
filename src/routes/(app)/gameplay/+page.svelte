<svelte:head>
	<title>DRAGO • Gameplay</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js"></script>
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar headerClass="gameplay-top" />

  <iframe class="webview-full" id="gameWebview" src="/about:blank" title="Game WebView" allowfullscreen></iframe>

  <div class="float-ball" id="floatBall" role="button" tabindex="0" aria-label="Toggle prediction panel">
    <img class="float-logo" src="/assets/images/predictionlogo.png" alt="Logo" onerror={(e) => (e.currentTarget.style.display = 'none')} />
    <div class="box-top">
      <div class="box-header">
        <div class="box-brand-wrap">
          <p class="box-brand">DRAGO PREDICTOR</p>
          <tgs-player
            class="box-heart-sticker"
            src="/assets/images/heart.tgs"
            autoplay
            loop
            mode="normal"
            aria-hidden="true"
          ></tgs-player>
        </div>
        <span class="box-live-pill"><span class="box-live-dot" aria-hidden="true"></span> Live</span>
      </div>
      <div class="box-body">
        <div class="box-period-wrap">
          <p class="box-period-label">Period</p>
          <p class="box-period" id="boxPeriod">—</p>
        </div>
        <div class="box-pred-wrap" id="boxPredWrap">
          <p class="box-pred-label">Signal</p>
          <p class="box-pred neutral" id="boxPred">—</p>
        </div>
      </div>
    </div>
    <div class="box-bottom">
      <button type="button" class="box-action" id="boxExit">Exit</button>
      <button type="button" class="box-action" id="boxHide">Hide</button>
    </div>
  </div>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/gameplay-page.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/gameplay__dashboard.js'),
			() => import('$lib/pages/gameplay__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
