<svelte:head>
	<title>DRAGO • Status</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar />

  <main class="status-wrap">
    <header class="status-intro" aria-labelledby="statusPageTitle">
      <span class="status-kicker">SERVICE HEALTH</span>
      <h1 id="statusPageTitle">System health</h1>
      <p>Current availability and recent uptime across DRAGO services.</p>
    </header>

    <div class="health-card">

      <p class="health-label">Overall health</p>

      <p class="health-pct" id="healthPct">—%</p>

      <div class="health-bar">
        <i id="healthBar"></i>
      </div>

      <p class="uptime-row" id="uptimeText">
        Uptime: —
      </p>

    </div>

    <div class="section-label">
      <span class="bar"></span>
      <span>Services</span>
    </div>

    <div class="check-list" id="checkList">
      <div class="status-loading">
        Loading status…
      </div>
    </div>

  </main>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/status-page.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/status__dashboard.js'),
			() => import('$lib/pages/status__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
