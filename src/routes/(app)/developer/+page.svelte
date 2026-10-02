<svelte:head>
	<title>DRAGO • Developer</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Luckiest+Guy&family=Lilita+One&display=swap" rel="stylesheet" />
<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>



  <AppTopBar />

  <main class="dev-page">
    <!-- Developer API intro -->
    <section class="dev-hero" aria-labelledby="developerPageTitle">
      <div class="dev-hero-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        API ACCESS
      </div>
      <h1 id="developerPageTitle">Developer API</h1>
      <p>Manage your keys, review daily usage, and copy ready-to-use examples for History and Prediction. Limit: 20 requests per minute per key.</p>
    </section>

    <!-- Create key bar -->
    <div class="create-bar">
      <div class="create-bar-label">Create API Key</div>
      <button class="btn-create-inline" id="openCreateModal" type="button">CREATE</button>
    </div>
    <div class="toast" id="toast" role="status" style="margin-bottom:14px"></div>

    <!-- Name popup -->
    <div class="modal-overlay" id="createModal" aria-hidden="true">
      <div class="modal-sheet" role="dialog" aria-labelledby="modalTitle">
        <h3 id="modalTitle">Key name</h3>
        <p class="modal-sub">Enter a name (min 4 characters)</p>
        <input id="keyName" type="text" maxlength="40" placeholder="e.g. my bot" autocomplete="off" />
        <div class="modal-err" id="modalErr"></div>
        <div class="modal-actions">
          <button type="button" class="modal-cancel" id="modalCancel">Cancel</button>
          <button type="button" class="modal-confirm" id="createKeyBtn">Create</button>
        </div>
      </div>
    </div>

    <!-- Keys list -->
    <div class="keys-wrap">
      <div class="keys-title">Your keys <span id="keyCountLabel" style="font-weight:600;letter-spacing:0;text-transform:none;color:#a08c70"></span></div>
      <div class="key-list" id="keyList">
        <div class="empty-state">Loading…</div>
      </div>
    </div>

    <!-- Usage + DATA / PREDICTION tabs -->
    <section class="usage-card" aria-labelledby="usageTitle">
      <div class="usage-heading">
        <div>
          <h2 id="usageTitle">API usage</h2>
          <p>Requests made today</p>
        </div>
      </div>
      <div class="usage-grid" id="usageGrid">
        <div class="usage-pill"><div class="u-n" id="uHist">0</div><div class="u-l">History</div></div>
        <div class="usage-pill"><div class="u-n" id="uPred">0</div><div class="u-l">Prediction</div></div>
        <div class="usage-pill"><div class="u-n" id="uTotal">0</div><div class="u-l">Total</div></div>
      </div>
      <div class="base-url-row" id="baseUrlRow">
        <span class="bu-label">Base URL:</span>
        <span class="bu-value" id="baseUrlText">—</span>
      </div>
      <div class="api-tabs">
        <button type="button" class="api-tab active" id="tabData" data-tab="data">DATA</button>
        <button type="button" class="api-tab" id="tabPred" data-tab="pred">PREDICTION</button>
      </div>
    </section>

    <!-- DATA panel -->
    <div class="api-panel active" id="panelData">
      <div class="dev-card">
        <div class="dev-card-head">
          <h2>History API</h2>
          <button class="ai-prompt-btn" id="histAiPromptBtn" type="button" aria-label="Get AI build prompt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg>
          </button>
        </div>
        <div class="lang-tabs" id="histLangTabs">
          <button type="button" class="lang-tab active" data-lang="url">URL</button>
          <button type="button" class="lang-tab" data-lang="html">HTML</button>
          <button type="button" class="lang-tab" data-lang="js">JavaScript</button>
          <button type="button" class="lang-tab" data-lang="curl">cURL</button>
          <button type="button" class="lang-tab" data-lang="python">Python</button>
          <button type="button" class="lang-tab" data-lang="node">Node.js</button>
          <button type="button" class="lang-tab" data-lang="php">PHP</button>
        </div>
        <div class="code-wrap">
          <div class="code-block" id="histCodeBox">—</div>
          <button class="code-copy-icon-btn" id="histCopyBtn" type="button" aria-label="Copy code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- PREDICTION panel -->
    <div class="api-panel" id="panelPred">
      <div class="dev-card">
        <div class="dev-card-head">
          <h2>Prediction API</h2>
        </div>
        <div class="lang-tabs" id="predLangTabs">
          <button type="button" class="lang-tab active" data-lang="url">URL</button>
          <button type="button" class="lang-tab" data-lang="html">HTML</button>
          <button type="button" class="lang-tab" data-lang="js">JavaScript</button>
          <button type="button" class="lang-tab" data-lang="curl">cURL</button>
          <button type="button" class="lang-tab" data-lang="python">Python</button>
          <button type="button" class="lang-tab" data-lang="node">Node.js</button>
          <button type="button" class="lang-tab" data-lang="php">PHP</button>
        </div>
        <div class="code-wrap">
          <div class="code-block" id="predCodeBox">—</div>
          <button class="code-copy-icon-btn" id="predCopyBtn" type="button" aria-label="Copy code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- AI build-prompt popup -->
    <div class="modal-overlay" id="aiPromptModal" aria-hidden="true">
      <div class="modal-sheet ai-modal-sheet" role="dialog" aria-labelledby="aiPromptTitle">
        <h3 id="aiPromptTitle">AI Build Prompt</h3>
        <p class="modal-sub">Copy this and give it to any AI (ChatGPT, Claude, etc.) — it will build an HTML app that auto-fetches predictions from this API.</p>
        <textarea class="ai-prompt-box" id="aiPromptText" readonly></textarea>
        <div class="ai-modal-actions">
          <button type="button" class="ai-modal-close" id="aiPromptCloseBtn">Close</button>
          <button type="button" class="ai-modal-copy" id="aiPromptCopyBtn">Copy Prompt</button>
        </div>
      </div>
    </div>

  </main>

<script>
	import AppTopBar from '$lib/components/AppTopBar.svelte';
import '$lib/css/developer-page.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Har script independently load hoti hai — original me alag <script> tags the,
		// ek fail hone se doosre nahi rukte the. Bina try/catch ke ek error poore
		// chain ko rok deta hai aur page atka reh jaata hai (refresh se theek hota tha).
		for (const load of [
			() => import('$lib/pages/developer__dashboard.js'),
			() => import('$lib/pages/developer__inline.js')
		]) {
			try { await load(); } catch (err) { console.error('[DRAGO] script load fail:', err); }
		}
	});
</script>
