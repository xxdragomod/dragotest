<svelte:head>
	<title>DRAGO • Subscription</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js"></script>
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar>
	<button slot="actions" class="history-btn" id="historyBtn" type="button" aria-label="Payment history" title="Payment history">
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"/>
			<polyline points="12 6 12 12 16 14"/>
		</svg>
	</button>
</AppTopBar>

  <main class="sub-wrap">
  <!-- Pending payment popup -->
  <div class="pending-pay-overlay" id="pendingPayBanner" aria-hidden="true">
    <div class="pending-pay-card" role="dialog" aria-labelledby="ppTitle">
      <h3 id="ppTitle">Payment pending</h3>
      <p class="pp-meta" id="ppPlanName">—</p>
      <p class="pp-meta" id="ppOrderId">—</p>
      <p class="pp-timer" id="ppTimer">Valid for —</p>
      <div class="pending-pay-actions">
        <button type="button" class="pp-continue" id="ppContinue">Continue</button>
        <button type="button" class="pp-close" id="ppCloseBtn">Close</button>
      </div>
    </div>
  </div>

  
    <div class="card-slider" id="cardSlider">
      <div class="card-track" id="cardTrack">

        <!-- ========== RX1 CARD ========== -->
        <div class="card-slide">
          <div class="sub-card">
            <div class="rx1-header">
              <div class="rx1-logo-wrap">
                <img src="/assets/images/predictionlogo.png" alt="RX1 Model" />
              </div>
              <div class="rx1-header-text">
                <span class="rx1-badge">AI Powered</span>
                <h1>RX1 MODEL</h1>
                <p>Smart analysis for next period</p>
              </div>
            </div>

            <div class="features-section">
              <h2>Features</h2>
              <ul class="features-list">
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">24×7 predictions available</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">API for predictions and game data</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Access the inbuilt platform system</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Add free experience</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Access the Auto Bet Pro system</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Unlimited Prediction</div>
                </li>
              </ul>
            </div>

            <div class="purchase-wrap">
              <button class="purchase-btn" type="button" id="purchaseBtn">Purchase</button>
            </div>
          </div>
        </div>

        <!-- ========== FREE CARD ========== -->
        <div class="card-slide">
          <div class="sub-card free-card">
            <div class="rx1-header">
              <div class="rx1-logo-wrap">
                <span class="rx1-logo-emoji" aria-hidden="true">🎁</span>
              </div>
              <div class="rx1-header-text">
                <span class="rx1-badge">Limited</span>
                <h1>FREE</h1>
                <p>Try before you buy</p>
              </div>
            </div>

            <div class="features-section">
              <h2>Features</h2>
              <ul class="features-list">
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/denied.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">24×7 predictions available</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/denied.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">API for predictions and game data</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/denied.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Access the inbuilt platform system</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/denied.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Add free experience</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/denied.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Access the Auto Bet Pro system</div>
                </li>
                <li>
                  <div class="feat-sticker">
                    <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
                  </div>
                  <div class="feat-text">Only 3 free Prediction</div>
                </li>
              </ul>
            </div>

            <div class="purchase-wrap">
              <button class="purchase-btn free-btn" type="button" id="freeBtn">Get Free</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="slider-dots" id="sliderDots">
      <button class="slider-dot active" type="button" data-index="0" aria-label="RX1 card"></button>
      <button class="slider-dot" type="button" data-index="1" aria-label="Free card"></button>
    </div>
    <p class="swipe-hint">← Swipe to switch plans →</p>
  </main>

  <!-- Purchase plans popup -->
  <div class="plans-overlay" id="plansOverlay" aria-hidden="true">
    <div class="plans-sheet" role="dialog" aria-labelledby="plansTitle">
      <div class="plans-handle"></div>
      <h2 class="plans-title" id="plansTitle">Choose Plan</h2>

      <div class="plan-option" data-plan="test">
        <div class="plan-name">
          RX1 FOR TEST
          <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
        </div>
        <div class="plan-row">
          <span class="plan-label">Price</span>
          <span class="plan-value price">
            300
            <tgs-player src="/assets/images/prediction.tgs" autoplay loop></tgs-player>
          </span>
        </div>
        <div class="plan-row">
          <span class="plan-label">Validity</span>
          <span class="plan-value">3 Days</span>
        </div>
      </div>

      <div class="plan-option" data-plan="beginners">
        <div class="plan-name">
          RX1 FOR BEGINNERS
          <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
        </div>
        <div class="plan-row">
          <span class="plan-label">Price</span>
          <span class="plan-value price">
            500
            <tgs-player src="/assets/images/prediction.tgs" autoplay loop></tgs-player>
          </span>
        </div>
        <div class="plan-row">
          <span class="plan-label">Validity</span>
          <span class="plan-value">7 Days</span>
        </div>
      </div>

      <div class="plan-option" data-plan="profit">
        <div class="plan-name">
          RX1 FOR PROFIT
          <tgs-player src="/assets/images/heart.tgs" autoplay loop></tgs-player>
        </div>
        <div class="plan-row">
          <span class="plan-label">Price</span>
          <span class="plan-value price">
            900
            <tgs-player src="/assets/images/prediction.tgs" autoplay loop></tgs-player>
          </span>
        </div>
        <div class="plan-row">
          <span class="plan-label">Validity</span>
          <span class="plan-value">15 Days</span>
        </div>
      </div>

      <button class="plans-close" type="button" id="plansClose">Close</button>
    </div>
  </div>

  <!-- Payment loading -->
  <div class="pay-loading" id="payLoading" aria-hidden="true">
    <div class="pay-loading-card">
      <p class="pay-loading-title">Preparing payment</p>
      <p class="pay-loading-sub">Loading checkout…</p>
      <div class="pay-progress-track">
        <div class="pay-progress-bar"></div>
      </div>
    </div>
  </div>

  <!-- Payment history -->
  <div class="hist-overlay" id="histOverlay" aria-hidden="true">
    <div class="hist-sheet" role="dialog" aria-labelledby="histTitle">
      <div class="plans-handle"></div>
      <h2 class="plans-title" id="histTitle">Payment History</h2>
      <div id="histList"><div class="hist-loading">Loading…</div></div>
      <button class="plans-close" type="button" id="histClose">Close</button>
    </div>
  </div>

  <!-- Custom / Open gateway (QR + UPI) — fallback jab main gateway inactive -->
  <div class="custom-pay-overlay" id="customPayOverlay" aria-hidden="true">
    <div class="custom-pay-sheet" role="dialog" aria-labelledby="customPayTitle">
      <div class="plans-handle"></div>
      <h2 class="plans-title" id="customPayTitle">Pay via UPI</h2>
      <p class="custom-pay-banner" id="customPayBanner">
        Primary gateway is unavailable. Scan the QR below to pay.
      </p>
      <div style="text-align:center;">
        <div class="custom-amount-pill">
          <span>Pay</span>
          ₹<span id="customPayAmount">0</span>
        </div>
      </div>
      <p class="custom-pay-meta" id="customPayOrderId"></p>
      <p class="custom-pay-timer" id="customPayTimer">Valid for 10:00</p>
      <div class="custom-qr-wrap">
        <div class="custom-qr-frame">
          <img id="customQrImg" src="" alt="UPI QR Code" width="170" height="170" />
        </div>
        <p class="custom-qr-hint">Scan with PhonePe, GPay, or any UPI app · 10 min limit</p>
        <div class="upi-app-grid">
          <button class="upi-app-btn phonepe" type="button" data-app="phonepe">
            <span class="app-dot"></span> PhonePe
          </button>
          <button class="upi-app-btn gpay" type="button" data-app="gpay">
            <span class="app-dot"></span> Google Pay
          </button>
          <button class="upi-app-btn navi" type="button" data-app="navi">
            <span class="app-dot"></span> Navi Pay
          </button>
          <button class="upi-app-btn supermoney" type="button" data-app="supermoney">
            <span class="app-dot"></span> SuperMoney
          </button>
        </div>
      </div>
      <div class="custom-utr-box">
        <span class="custom-upi-label">UTR / Transaction ID</span>
        <input
          id="customUtrInput"
          type="text"
          inputmode="numeric"
          maxlength="22"
          placeholder="Enter 12-digit UTR"
          autocomplete="off"
        />
        <p class="custom-utr-hint">After payment, copy the UTR from your UPI app and paste it here</p>
      </div>
      <ol class="custom-steps">
        <li>Scan the QR and pay the exact amount</li>
        <li>Enter the UTR number (required)</li>
        <li>Tap “I have paid” — plan activates after approval</li>
      </ol>
      <button class="custom-done-btn" type="button" id="customPaidBtn">I have paid</button>
      <button class="plans-close" type="button" id="customPayClose">Close</button>
    </div>
  </div>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/subscription-page.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/subscription__dashboard.js'),
			() => import('$lib/pages/subscription__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
