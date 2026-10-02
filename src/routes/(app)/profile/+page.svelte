<svelte:head>
	<title>Profile - Drago Predictor</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet">
<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<!-- Drawer -->


  <!-- Top bar -->
  <AppTopBar />

  <!-- Profile dashboard inspired by the supplied account-page reference. -->
  <main class="profile-main profile-page-shell" id="pageContent">
    <div id="skeletonView" class="profile-loading" aria-label="Loading account">
      <div class="profile-skeleton profile-skeleton-identity"></div>
      <div class="profile-skeleton profile-skeleton-membership"></div>
      <div class="profile-skeleton profile-skeleton-grid"></div>
      <div class="profile-skeleton profile-skeleton-list"></div>
    </div>

    <div id="profileContent" class="profile-content" style="display:none;">
      <button class="profile-card profile-identity-card" id="profileCard" type="button" aria-label="Open personal details">
        <span class="profile-avatar-wrap">
          <img id="profilePic" class="profile-avatar" src="/assets/nav/dashboard-brand-mark.png" alt="" referrerpolicy="no-referrer" />
        </span>
        <span class="profile-info">
          <span class="profile-kicker">MY ACCOUNT</span>
          <span class="profile-name" id="profileName">Loading…</span>
          <span class="profile-email" id="profileEmailSub"></span>
        </span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <section class="upgrade-banner profile-membership-card" id="upgradeBanner" aria-labelledby="membershipTitle">
        <div class="profile-membership-top">
          <div class="profile-membership-copy">
            <span class="profile-membership-kicker">MEMBERSHIP STATUS</span>
            <div class="upgrade-title" id="membershipTitle">Upgrade to Pro</div>
            <div class="upgrade-desc">Unlock premium predictions and member features.</div>
          </div>
          <span class="profile-plan-pill" id="profilePlanPill">FREE</span>
        </div>
        <div class="profile-membership-footer">
          <span id="membershipFootnote">Your account access</span>
          <button class="upgrade-btn" id="upgradeBtn" type="button">Explore Pro</button>
        </div>
      </section>

      <button class="profile-reward-card" id="planBtn" type="button">
        <span class="profile-reward-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 8.5h16v11H4zM3 5h18v4H3zM12 5v14M12 5H8.7a2.2 2.2 0 1 1 2.2-2.2V5Zm0 0h3.3a2.2 2.2 0 1 0-2.2-2.2V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span class="profile-reward-copy">
          <strong>Plan &amp; benefits</strong>
          <small>View your current access and available plans</small>
        </span>
        <svg class="profile-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <section class="profile-section" aria-labelledby="profileQuickTitle">
        <h2 class="profile-section-title" id="profileQuickTitle">Quick access</h2>
        <div class="profile-shortcut-grid">
          <button class="profile-shortcut" id="personalDetailsBtn" type="button">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg></span><span>Account details</span>
          </button>
          <button class="profile-shortcut" id="authProviderBtn" type="button">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></span><span>Sign-in method</span>
          </button>
          <a class="profile-shortcut" href="/auto-bet/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.55-2.6L20 12M4 12l2.85 5.6A7 7 0 0 0 18.4 15"/></svg></span><span>Auto Bet</span>
          </a>
          <a class="profile-shortcut" href="/developer/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg></span><span>Developer API</span>
          </a>
          <a class="profile-shortcut" href="/game/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10a4 4 0 0 1 3.9 3.1l1.5 7.2a3 3 0 0 1-4.8 3l-2.2-1.7H8.6l-2.2 1.7a3 3 0 0 1-4.8-3l1.5-7.2A4 4 0 0 1 7 4Z"/><path d="M8 8v5M5.5 10.5h5M16.5 9h.01M18.5 12h.01"/></svg></span><span>Games</span>
          </a>
          <a class="profile-shortcut" href="/status/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h4l2.2-6 4.2 12 2.2-6H21"/><path d="M3 4h18v16H3z"/></svg></span><span>Service status</span>
          </a>
          <a class="profile-shortcut" href="/chat/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg></span><span>NEXUS Agent</span>
          </a>
          <a class="profile-shortcut" href="/wingo-game-guide/">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 6h13M8 10h8M8 14h6"/></svg></span><span>Game guide</span>
          </a>
          <button class="profile-shortcut" id="privacyBtn" type="button">
            <span class="profile-shortcut-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9 12h6"/></svg></span><span>Privacy policy</span>
          </button>
        </div>
      </section>

      <section class="profile-section" aria-labelledby="profileSettingsTitle">
        <h2 class="profile-section-title" id="profileSettingsTitle">Account &amp; support</h2>
        <div class="profile-list-card">
          <a class="profile-list-row" href="/notifications/">
            <span class="profile-list-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg></span>
            <span class="profile-list-copy"><strong>Announcements</strong><small>Notifications and account updates</small></span>
            <svg class="profile-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <a class="profile-list-row" href="/dashboard/#dashboard-activity-title">
            <span class="profile-list-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/></svg></span>
            <span class="profile-list-copy"><strong>Activity</strong><small>View your recent daily visits</small></span>
            <svg class="profile-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <button class="profile-list-row" id="preferencesBtn" type="button">
            <span class="profile-list-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></span>
            <span class="profile-list-copy"><strong>Preferences</strong><small>Choose your app settings</small></span>
            <svg class="profile-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="profile-list-row" id="helpBtn" type="button">
            <span class="profile-list-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.9 2.9 0 1 1 4.9 2.1c-1.4 1.2-2.1 1.5-2.1 3.4M12 17.5h.01"/></svg></span>
            <span class="profile-list-copy"><strong>Help center</strong><small>Support, FAQs, and payment help</small></span>
            <svg class="profile-row-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </section>

      <div class="logout-area profile-logout-area">
        <button class="btn-logout profile-logout" id="logoutBtn2" type="button">Logout</button>
      </div>
    </div>
  </main>

  <!-- Same-page sub view -->
  <section class="subpage" id="subpage" aria-hidden="true">
    <header class="subpage-top">
      <button class="subpage-back" id="subpageBack" type="button" aria-label="Go back">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h2 class="subpage-title" id="subpageTitle">Details</h2>
    </header>
    <div class="subpage-body" id="subpageBody"></div>
  </section>

  <!-- Toast -->
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/profile.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/profile__dashboard.js'),
			() => import('$lib/pages/profile__profile.js'),
			() => import('$lib/pages/profile__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
