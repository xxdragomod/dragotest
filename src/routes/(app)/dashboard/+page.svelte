<svelte:head>
	<title>DRAGO • Dashboard</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar />

  <main class="dash-main">
    <section class="promo-carousel" aria-label="DRAGO Predictor RX1 promotion">
      <a class="promo-slide" href="/prediction/" aria-label="Open RX1 predictions">
        <img
          src="/assets/images/banners/rx1-model-feature.webp"
          alt="DRAGO Predictor RX1 Model — smart analysis and 85% accuracy"
          width="1774"
          height="887"
          loading="eager"
          decoding="async"
        />
      </a>
    </section>

    <nav class="dashboard-actions" aria-label="Dashboard shortcuts">
      <a class="dashboard-action" href="/developer/">
        <img class="dashboard-action-icon" src="/assets/nav/dashboard-developer.png" alt="" aria-hidden="true" />
        <span>Developer</span>
      </a>

      <a class="dashboard-action" href="/auto-bet/">
        <img class="dashboard-action-icon" src="/assets/nav/dashboard-auto-bet.png" alt="" aria-hidden="true" />
        <span>Auto Bet</span>
      </a>

      <a class="dashboard-action" href="/status/">
        <img class="dashboard-action-icon" src="/assets/nav/dashboard-status.png" alt="" aria-hidden="true" />
        <span>Status</span>
      </a>

      <a class="dashboard-action" href="https://t.me/xx_drago" target="_blank" rel="noopener noreferrer">
        <img class="dashboard-action-icon" src="/assets/nav/dashboard-support.png" alt="" aria-hidden="true" />
        <span>Support</span>
      </a>
    </nav>

    <section class="dashboard-feature-links" aria-label="Featured destinations">
      <a class="dashboard-feature-card rx1-card" href="/prediction/">
        <span class="dashboard-feature-copy">
          <span class="dashboard-feature-title">RX1 MODEL</span>
          <span class="dashboard-feature-subtitle">Smart predictions</span>
        </span>
        <img class="dashboard-feature-icon" src="/assets/nav/dashboard-rx1-mark.png" alt="" aria-hidden="true" />
      </a>

      <a class="dashboard-feature-card nexus-card" href="/chat/">
        <span class="dashboard-feature-copy">
          <span class="dashboard-feature-title">NEXUS SERVER</span>
          <span class="dashboard-feature-subtitle">NEXUS Agent</span>
        </span>
        <img class="dashboard-feature-icon" src="/assets/nav/dashboard-nexus-mark.png" alt="" aria-hidden="true" />
      </a>
    </section>

    <section class="dashboard-activity-card" aria-labelledby="dashboard-activity-title">
      <div class="dashboard-activity-header">
        <div>
          <span class="dashboard-activity-eyebrow">YOUR ACTIVITY</span>
          <h2 class="dashboard-activity-title" id="dashboard-activity-title">Daily visits</h2>
        </div>
        <span class="dashboard-activity-period">LAST 7 DAYS</span>
      </div>

      <div class="dashboard-activity-chart" role="group" aria-label="App page visits by day">
        {#if activityDays.length}
          {#each activityDays as day (day.key)}
            <div class="dashboard-activity-day" class:today={day.isToday} role="img" aria-label={`${day.fullLabel}: ${day.count} page visits`}>
              <span class="dashboard-activity-count">{day.count}</span>
              <span class="dashboard-activity-track" aria-hidden="true">
                <span class="dashboard-activity-bar" style={`--activity-height:${day.height}%`}></span>
              </span>
              <span class="dashboard-activity-day-label">{day.label}</span>
            </div>
          {/each}
        {:else}
          <div class="dashboard-activity-empty">Loading your activity…</div>
        {/if}
      </div>

      <p class="dashboard-activity-note">Page visits · saved on this device · tracking starts today</p>
    </section>

  </main>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/dashboard-page.css';
	import { onMount } from 'svelte';
	import { readLastSevenDaysActivity, activityUpdatedEventName } from '$lib/pages/dashboard-activity.js';

	let activityDays = [];

	onMount(() => {
		const refreshActivity = () => {
			activityDays = readLastSevenDaysActivity().days;
		};
		const activityEvent = activityUpdatedEventName();
		refreshActivity();
		window.addEventListener(activityEvent, refreshActivity);
		const refreshAfterNavigation = window.setTimeout(refreshActivity, 0);

		import('$lib/pages/dashboard__dashboard.js').catch((err) => {
			console.error('[DRAGO] dashboard session check failed:', err);
		});

		return () => {
			window.removeEventListener(activityEvent, refreshActivity);
			window.clearTimeout(refreshAfterNavigation);
		};
	});
</script>
