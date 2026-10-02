<svelte:head>
	<title>DRAGO • Prediction</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
  />
	<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&display=swap"
    rel="stylesheet"
  />
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js"></script>
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<!-- =====================================================
       DRAWER OVERLAY
       ===================================================== -->




  <!-- =====================================================
       TOP HEADER
       ===================================================== -->

  <AppTopBar />


  <!-- =====================================================
       MAIN CONTENT
       ===================================================== -->

  <main class="pred-wrap">


    <!-- ===================================================
         SKELETON
         =================================================== -->

    <div id="skeletonView">


      <div class="sk-pt-bar">


        <div
          class="sk-blob"
          style="
            width:140px;
            height:18px;
            border-radius:8px;
          "
        >
        </div>


        <div
          class="sk-blob"
          style="
            width:72px;
            height:18px;
            border-radius:8px;
          "
        >
        </div>


      </div>


    </div>


    <!-- ===================================================
         PREDICTION CONTENT
         =================================================== -->

    <div
      id="predictionContent"
      hidden
    >


      <!-- =================================================
           TOP ROW: Period + Timer cards
           ================================================= -->

      <div class="pred-top-row">

        <div class="pred-mini-card pred-period-card">
          <span class="pred-mini-label">Period</span>
          <div class="pred-mini-value-row">
            <span class="pred-pt-dot"></span>
            <span class="pred-pt-val pred-pt-period" id="predPeriodTop">—</span>
          </div>
        </div>

        <div class="pred-mini-card pred-timer-card">
          <span class="pred-mini-label">Time remaining</span>
          <span class="pred-pt-val pred-pt-timer" id="predTimerTop">00 : 30</span>
        </div>

      </div>


      <!-- =================================================
           AI PREDICTION CARD
           ================================================= -->

      <div class="pred-ai-card" id="predAiCard" style="position:relative;">

        <div class="pred-ai-header">
          <div class="pred-ai-header-left">
            <img
              class="pred-ai-logo"
              src="/assets/images/predictionlogo.png"
              alt="RX1"
            />
            <div>
              <div class="pred-ai-title">RX1 MODEL</div>
              <div class="pred-ai-sub">Smart analysis for next period</div>
            </div>
          </div>
        </div>

        <!-- Free-user lock overlay -->
        <div id="freePredOverlay" hidden style="
          position:absolute;inset:0;z-index:5;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          background:rgba(23,19,14,0.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          border-radius:inherit;padding:1rem;text-align:center;">
          <button type="button" id="getPredBtn" style="
            font-family:'Lilita One',cursive;font-size:1.15rem;letter-spacing:0.04em;
            padding:0.7rem 1.4rem;border:0;border-radius:999px;cursor:pointer;
            background:linear-gradient(135deg,#c9a050,#e8c070);color:#2a2116;
            box-shadow:0 8px 22px rgba(201,160,80,0.35);">
            GET PREDICTION
          </button>
          <p id="freePredHint" style="margin:0.65rem 0 0;font-size:0.78rem;color:rgba(255,250,242,0.75);font-weight:600;">
            3 free predictions remaining
          </p>
          <a id="upgradePredLink" href="/subscription/" hidden style="
            margin-top:0.75rem;font-size:0.85rem;font-weight:700;color:#f0c060;text-decoration:underline;">
            Upgrade to Pro Plan for unlimited predictions
          </a>
        </div>

        <div class="pred-ai-body">

          <!-- Left: Level gauge -->
          <div class="pred-ai-col pred-ai-col-gauge">
            <div class="pred-gauge-ring pred-gauge-lg" data-gauge="level">
              <img class="pred-gauge-icon" src="/assets/images/levelmeter.png" alt="" aria-hidden="true"
                onerror={(e) => (e.currentTarget.style.display = 'none')} />
              <svg viewBox="0 0 36 36" class="pred-gauge-svg">
                <circle class="pred-gauge-track" cx="18" cy="18" r="14" />
                <circle class="pred-gauge-fill" id="gaugeLevelFill" cx="18" cy="18" r="14"
                  stroke-dasharray="0 88" />
              </svg>
              <span class="pred-gauge-val" id="gaugeLevelVal">0</span>
            </div>
            <span class="pred-gauge-label">Level</span>
          </div>

          <!-- Center: stickers + result -->
          <div class="pred-ai-col pred-ai-col-main">
            <div class="pred-result-wrap">
              <tgs-player
                class="pred-sticker"
                src="/assets/images/prediction.tgs"
                autoplay
                loop
                mode="normal"
                aria-hidden="true"
              ></tgs-player>

              <div class="pred-result-plain" id="predResultValue">—</div>

              <tgs-player
                class="pred-sticker"
                src="/assets/images/prediction.tgs"
                autoplay
                loop
                mode="normal"
                aria-hidden="true"
              ></tgs-player>
            </div>
            <span class="pred-center-label">Next Period</span>
            <span class="pred-hint" id="predHintText"></span>
          </div>

          <!-- Right: Confidence gauge -->
          <div class="pred-ai-col pred-ai-col-gauge">
            <div class="pred-gauge-ring pred-gauge-lg" data-gauge="confidence">
              <img class="pred-gauge-icon" src="/assets/images/confidencemeter.png" alt="" aria-hidden="true"
                onerror={(e) => (e.currentTarget.style.display = 'none')} />
              <svg viewBox="0 0 36 36" class="pred-gauge-svg">
                <circle class="pred-gauge-track" cx="18" cy="18" r="14" />
                <circle class="pred-gauge-fill" id="gaugeConfFill" cx="18" cy="18" r="14"
                  stroke-dasharray="0 88" />
              </svg>
              <span class="pred-gauge-val" id="gaugeConfVal">0</span>
            </div>
            <span class="pred-gauge-label">Confidence</span>
          </div>

        </div>

        <!-- Bottom power bar -->
        <div class="pred-power-row" id="predGauges">
          <span class="pred-power-label">Power</span>
          <div class="pred-power-track">
            <div class="pred-power-fill" id="gaugePowerBar" style="width:100%"></div>
          </div>
          <span class="pred-power-val" id="gaugePowerVal">100%</span>
        </div>

      </div>


      <!-- =================================================
           LIVE MARKET CHART
           ================================================= -->

      <div class="pred-chart-card" id="predChartCard">
        <div class="pred-chart-header">
          <div class="pred-chart-title-row">
            <span class="pred-chart-dot"></span>
            <span class="pred-chart-title">Live Market</span>
          </div>
          <span class="pred-chart-meta" id="chartMeta">—</span>
        </div>
        <div class="pred-chart-canvas-wrap">
          <canvas id="predChartCanvas" width="400" height="160"></canvas>
        </div>
        <div class="pred-chart-legend">
          <span class="pred-leg pred-leg-big"><i></i>Big (5–9)</span>
          <span class="pred-leg pred-leg-small"><i></i>Small (0–4)</span>
          <span class="pred-leg pred-leg-line"><i></i>Number</span>
        </div>
        <div class="pred-chart-balls" id="chartBalls"></div>
      </div>


      <!-- =================================================
           BOTTOM UI IMAGE
           ================================================= -->

      <div class="pred-ui-banner">
        <img
          class="pred-ui-img"
          src="/assets/images/predictionui.png"
          alt=""
        />
      </div>



    </div>


    <!-- ===================================================
         ERROR VIEW
         =================================================== -->

    <div
      id="errorView"
      hidden
    >


      <div class="pred-error-box">


        <div class="error-icon">
          ⚡
        </div>


        <p>
          Failed to load prediction.
        </p>


        <button
          type="button"
          id="errorRetryBtn"
        >
          Try Again
        </button>


      </div>


    </div>


  </main>


  <!-- =====================================================
       DRAGO CONFIG
       ===================================================== -->





  <!-- =====================================================
       JAVASCRIPT
       ===================================================== -->






  <!-- =====================================================
       TGS ERROR CHECK
       ===================================================== -->

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/prediction.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/prediction__dashboard.js'),
			() => import('$lib/pages/prediction__prediction.js'),
			() => import('$lib/pages/prediction__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
