
;



;

function dragoApiFetch(url, init) {
    init = init || {};
    init.mode = "auth";
    if (window.DRAGO_SEC && DRAGO_SEC.signedFetch) return DRAGO_SEC.signedFetch(url, init);
    var headers = Object.assign({}, (init.headers || {}));
    var token = sessionStorage.getItem("drago_token") || "";
    if (token && !headers.Authorization) headers.Authorization = "Bearer " + token;
    init.headers = headers;
    return fetch(url, init);
  }

;



;

(function () {
      var menuBtn = document.getElementById("menuBtn");
      var sideDrawer = document.getElementById("sideDrawer");
      var drawerOverlay = document.getElementById("drawerOverlay");
      var drawerClose = document.getElementById("drawerClose");

      function openDrawer() {
        if (sideDrawer) sideDrawer.classList.add("open");
        if (drawerOverlay) drawerOverlay.classList.add("show");
        if (sideDrawer) sideDrawer.setAttribute("aria-hidden", "false");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
        document.body.classList.add("drawer-open");
      }
      function closeDrawer() {
        if (sideDrawer) sideDrawer.classList.remove("open");
        if (drawerOverlay) drawerOverlay.classList.remove("show");
        if (sideDrawer) sideDrawer.setAttribute("aria-hidden", "true");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("drawer-open");
      }
      if (menuBtn) menuBtn.addEventListener("click", openDrawer);
      if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
      if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);
function isValidApiUrl(url) {
        if (!url || typeof url !== "string") return false;
        try { return new URL(url).protocol === "https:"; } catch (_) { return false; }
      }
      var RAW = (window.__DRAGO_CONFIG__ || {}).API_URL || "";
      var API_URL = isValidApiUrl(RAW) ? RAW.replace(/\/$/, "") : "";
      var PUB_RAW = (window.__DRAGO_CONFIG__ || {}).PUBLIC_API_URL || "https://dragopredictor.vercel.app";
      var PUBLIC_BASE = isValidApiUrl(PUB_RAW) ? PUB_RAW.replace(/\/$/, "") : "https://dragopredictor.vercel.app";
      var token = sessionStorage.getItem("drago_token") || "";

      var keyList = document.getElementById("keyList");
      var keyCountLabel = document.getElementById("keyCountLabel");
      var toast = document.getElementById("toast");
      var histCodeBox = document.getElementById("histCodeBox");
      var predCodeBox = document.getElementById("predCodeBox");
      var histLangTabs = document.getElementById("histLangTabs");
      var predLangTabs = document.getElementById("predLangTabs");
      var histCopyBtn = document.getElementById("histCopyBtn");
      var predCopyBtn = document.getElementById("predCopyBtn");
      var baseUrlText = document.getElementById("baseUrlText");
      if (baseUrlText) baseUrlText.textContent = API_URL || PUBLIC_BASE || "—";
      var uHist = document.getElementById("uHist");
      var uPred = document.getElementById("uPred");
      var uTotal = document.getElementById("uTotal");
      var createKeyBtn = document.getElementById("createKeyBtn");
      var keyNameInput = document.getElementById("keyName");
      var createModal = document.getElementById("createModal");
      var openCreateModal = document.getElementById("openCreateModal");
      var modalCancel = document.getElementById("modalCancel");
      var modalErr = document.getElementById("modalErr");

      function openModal() {
        if (modalErr) modalErr.textContent = "";
        if (keyNameInput) keyNameInput.value = "";
        if (createModal) {
          createModal.classList.add("open");
          createModal.setAttribute("aria-hidden", "false");
        }
        setTimeout(function () {
          if (keyNameInput) keyNameInput.focus();
        }, 50);
      }
      function closeModal() {
        if (createModal) {
          createModal.classList.remove("open");
          createModal.setAttribute("aria-hidden", "true");
        }
        if (modalErr) modalErr.textContent = "";
      }
      if (openCreateModal) openCreateModal.addEventListener("click", openModal);
      if (modalCancel) modalCancel.addEventListener("click", closeModal);
      if (createModal) {
        createModal.addEventListener("click", function (e) {
          if (e.target === createModal) closeModal();
        });
      }
      var sampleKey = "YOUR_API_KEY";

      // ── AI build-prompt popup (History API) ──────────────────────────────
      var histAiPromptBtn = document.getElementById("histAiPromptBtn");
      var aiPromptModal = document.getElementById("aiPromptModal");
      var aiPromptText = document.getElementById("aiPromptText");
      var aiPromptCopyBtn = document.getElementById("aiPromptCopyBtn");
      var aiPromptCloseBtn = document.getElementById("aiPromptCloseBtn");

      function buildAiPrompt() {
        var base = API_URL || "https://dragopredictor.onrender.com";
        var predUrl = base + "/v1/wingo30s/prediction";
        var histUrl = base + "/v1/wingo30s/history?limit=1";
        return (
          "Build a polished single-page mobile web app (HTML + CSS + JS, no frameworks) for DRAGO PREDICTOR (WinGo 30s).\n\n" +
          "=== AUTH ===\n" +
          "All requests need header: X-API-Key: " + sampleKey + "\n" +
          "(or query ?api_key=" + sampleKey + ")\n\n" +
          "=== PREDICTION API ===\n" +
          "GET " + predUrl + "\n" +
          "Success JSON shape (only these fields):\n" +
          "{\n" +
          '  "success": true,\n' +
          '  "Server": "🐉 DRAGO PREDICTOR",\n' +
          '  "Timestamp": "2026-08-28T15:42:00.733Z",\n' +
          '  "Period": "20260828100051884",\n' +
          '  "PREDICTION": "BIG" | "SMALL" | "SKIP",\n' +
          '  "CONFIDENCE": 65,\n' +
          '  "CURRENT LEVEL": 2\n' +
          "}\n\n" +
          "=== HISTORY API ===\n" +
          "GET " + histUrl + "\n" +
          "Success JSON shape:\n" +
          "{\n" +
          '  "success": true,\n' +
          '  "count": 1,\n' +
          '  "limit": 1,\n' +
          '  "Server": "🐉 DRAGO PREDICTOR",\n' +
          '  "updated_at": "2026-08-28T15:42:00.733Z",\n' +
          '  "items": [{\n' +
          '    "issueNumber": "20260828100051884",\n' +
          '    "number": "5",\n' +
          '    "color": "green,violet",\n' +
          '    "premium": "5",\n' +
          '    "sum": 0\n' +
          "  }]\n" +
          "}\n\n" +
          "=== HOW THE APP SHOULD WORK ===\n" +
          "1. On load, fetch PREDICTION API and show Period, PREDICTION, CONFIDENCE, CURRENT LEVEL.\n" +
          "2. Poll on IST clock at second :01 and :31 every minute (new signal every 30s at :00/:30).\n" +
          "3. Also fetch HISTORY API to show last draw number/color (optional chart).\n" +
          "4. Live countdown to next :00 or :30 boundary.\n" +
          "5. Map PREDICTION text: BIG / SMALL / SKIP with clear colors.\n" +
          "6. On HTTP 402/403 show upgrade/billing message; on network error show retry UI.\n" +
          "7. Mobile-first, clean UI, no page reload needed.\n" +
          "8. Brand the UI as DRAGO PREDICTOR (Server field is for attribution)."
        );
      }

      function openAiPromptModal() {
        if (aiPromptText) aiPromptText.value = buildAiPrompt();
        if (aiPromptModal) {
          aiPromptModal.classList.add("open");
          aiPromptModal.setAttribute("aria-hidden", "false");
        }
      }
      function closeAiPromptModal() {
        if (aiPromptModal) {
          aiPromptModal.classList.remove("open");
          aiPromptModal.setAttribute("aria-hidden", "true");
        }
      }
      if (histAiPromptBtn) histAiPromptBtn.addEventListener("click", openAiPromptModal);
      if (aiPromptCloseBtn) aiPromptCloseBtn.addEventListener("click", closeAiPromptModal);
      if (aiPromptModal) {
        aiPromptModal.addEventListener("click", function (e) {
          if (e.target === aiPromptModal) closeAiPromptModal();
        });
      }
      if (aiPromptCopyBtn) {
        aiPromptCopyBtn.addEventListener("click", function () {
          copyText(aiPromptText.value).then(function () { showToast("Prompt copied"); });
        });
      }

      function showToast(msg, isErr) {
        toast.textContent = msg;
        toast.className = "toast show" + (isErr ? " err" : "");
        clearTimeout(showToast._t);
        showToast._t = setTimeout(function () { toast.className = "toast"; }, 2800);
      }

      function authHeaders() {
        return {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Accept: "application/json"
        };
      }

      var histLang = "url";
      var predLang = "url";

      function buildSnippet(kind, lang, key) {
        var k = key || sampleKey;
        var base = API_URL || "https://dragopredictor.onrender.com";
        var path = kind === "history" ? "/v1/wingo30s/history" : "/v1/wingo30s/prediction";
        var qs = kind === "history" ? "?api_key=" + k + "&limit=1" : "?api_key=" + k;
        var urlWithKey = base + path + qs;
        var urlNoKey = base + path + (kind === "history" ? "?limit=1" : "");

        if (lang === "url") return urlWithKey;

        if (lang === "curl") {
          return 'curl -s "' + urlNoKey + '" \\\n  -H "X-API-Key: ' + k + '"';
        }
        if (lang === "python") {
          return 'import requests\n\nurl = "' + urlNoKey + '"\nheaders = {"X-API-Key": "' + k + '"}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())';
        }
        if (lang === "node") {
          return 'const res = await fetch("' + urlNoKey + '", {\n  headers: { "X-API-Key": "' + k + '" }\n});\nconst data = await res.json();\nconsole.log(data);';
        }
        if (lang === "html") {
          return '<script>\n  fetch("' + urlNoKey + '", {\n    headers: { "X-API-Key": "' + k + '" }\n  })\n    .then(function (res) { return res.json(); })\n    .then(function (data) { console.log(data); });\n<' + '/script>';
        }
        if (lang === "js") {
          return 'fetch("' + urlNoKey + '", {\n  headers: { "X-API-Key": "' + k + '" }\n})\n  .then(function (res) { return res.json(); })\n  .then(function (data) { console.log(data); });';
        }
        if (lang === "php") {
          return '<?php\n$ch = curl_init("' + urlNoKey + '");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: ' + k + '"]);\n$response = curl_exec($ch);\ncurl_close($ch);\n\n$data = json_decode($response, true);\nprint_r($data);';
        }
        return urlWithKey;
      }

      function renderCodeBox(kind) {
        var box = kind === "history" ? histCodeBox : predCodeBox;
        var lang = kind === "history" ? histLang : predLang;
        if (box) box.textContent = buildSnippet(kind, lang, sampleKey);
      }

      function wireLangTabs(kind, wrap) {
        if (!wrap) return;
        var tabs = wrap.querySelectorAll(".lang-tab");
        tabs.forEach(function (tab) {
          tab.addEventListener("click", function () {
            tabs.forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");
            if (kind === "history") histLang = tab.getAttribute("data-lang");
            else predLang = tab.getAttribute("data-lang");
            renderCodeBox(kind);
          });
        });
      }
      wireLangTabs("history", histLangTabs);
      wireLangTabs("prediction", predLangTabs);

      function updateEndpointBoxes(key) {
        if (key) sampleKey = key;
        renderCodeBox("history");
        renderCodeBox("prediction");
      }

      var ICON_COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      var ICON_CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

      function flashCopied(btn) {
        if (!btn) return;
        btn.innerHTML = ICON_CHECK_SVG;
        btn.classList.add("copied");
        clearTimeout(btn._t);
        btn._t = setTimeout(function () {
          btn.innerHTML = ICON_COPY_SVG;
          btn.classList.remove("copied");
        }, 1600);
      }

      if (histCopyBtn) {
        histCopyBtn.addEventListener("click", function () {
          copyText(histCodeBox.textContent).then(function () {
            showToast("History code copied");
            flashCopied(histCopyBtn);
          });
        });
      }
      if (predCopyBtn) {
        predCopyBtn.addEventListener("click", function () {
          copyText(predCodeBox.textContent).then(function () {
            showToast("Prediction code copied");
            flashCopied(predCopyBtn);
          });
        });
      }

      function loadUsage() {
        if (!API_URL || !token) return;
        dragoApiFetch(API_URL + "/api-usage", { headers: authHeaders() })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || !data.success) return;
            var tdy = data.today || {};
            if (uHist) uHist.textContent = String(tdy.history || 0);
            if (uPred) uPred.textContent = String(tdy.prediction || 0);
            if (uTotal) uTotal.textContent = String(tdy.total || 0);

            /* Free plan billing banner */
            var banner = document.getElementById("billingBanner");
            if (!banner) {
              banner = document.createElement("div");
              banner.id = "billingBanner";
              banner.style.cssText =
                "display:none;margin:0 0 0.85rem;padding:0.75rem 0.9rem;border-radius:0.85rem;" +
                "background:rgba(240,160,96,0.12);border:1px solid rgba(240,160,96,0.35);" +
                "color:#f0c060;font-size:0.82rem;font-weight:600;line-height:1.4;cursor:pointer;";
              var main = document.querySelector(".dev-page") || document.querySelector("main");
              if (main && main.firstChild) main.insertBefore(banner, main.firstChild);
              else if (main) main.appendChild(banner);
              banner.addEventListener("click", function () {
                window.location.href = "../subscription/";
              });
            }
            if (data.billing_required) {
              banner.style.display = "block";
              banner.textContent =
                data.billing_message ||
                "Free plan limit reached (10 history fetches). Please complete billing / upgrade to Pro.";
            } else if (data.plan === "free" && data.rate_limit) {
              var used = (data.rate_limit.history_used != null)
                ? data.rate_limit.history_used
                : (data.total && data.total.history) || 0;
              var lim = data.rate_limit.lifetime_history || 10;
              banner.style.display = "block";
              banner.style.background = "rgba(255,250,242,0.06)";
              banner.style.borderColor = "rgba(255,250,242,0.12)";
              banner.style.color = "rgba(255,250,242,0.7)";
              banner.textContent =
                "Free plan: " + used + "/" + lim + " history fetches used. Pro = 20 req/min unlimited.";
            } else {
              banner.style.display = "none";
            }
          })
          .catch(function () {});
      }

      function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        document.body.removeChild(ta);
        return Promise.resolve();
      }

      function maskKey(key) {
        if (!key || key.length < 8) return "••••••••••••••••";
        return String(key).slice(0, 8) + " ••••••••••••";
      }
      function displayKey(k) {
        if (k.api_key_masked) return k.api_key_masked;
        if (k.key_prefix) return maskKey(k.key_prefix);
        if (k.api_key) return maskKey(k.api_key);
        return "••••••••••••••••";
      }

      var EYE_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      var ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      var ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      var EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

      function renderKeys(keys) {
        var n = (keys && keys.length) || 0;
        if (keyCountLabel) keyCountLabel.textContent = n ? "(" + n + "/5)" : "";
        if (!n) {
          keyList.innerHTML = '<div class="empty-state">No keys yet. Tap CREATE above.</div>';
          updateEndpointBoxes(null);
          return;
        }
        sampleKey = "YOUR_API_KEY";
        updateEndpointBoxes(sampleKey);
        keyList.innerHTML = "";
        keys.forEach(function (k) {
          var row = document.createElement("div");
          row.className = "key-row";

          var name = document.createElement("div");
          name.className = "key-name";
          name.textContent = (k.name || "KEY").toUpperCase();
          name.title = k.name || "KEY";

          var scroll = document.createElement("div");
          scroll.className = "key-scroll";
          var code = document.createElement("span");
          code.className = "key-code is-masked";
          code.textContent = displayKey(k);
          scroll.appendChild(code);

          var icons = document.createElement("div");
          icons.className = "key-icons";

          var eyeBtn = document.createElement("button");
          eyeBtn.className = "icon-btn";
          eyeBtn.type = "button";
          eyeBtn.setAttribute("aria-label", "Show key");
          eyeBtn.innerHTML = EYE_OPEN;
          eyeBtn.addEventListener("click", function () {
            showToast("Key is hashed. Full value only available when created.", true);
          });

          var copyBtn = document.createElement("button");
          copyBtn.className = "icon-btn";
          copyBtn.type = "button";
          copyBtn.setAttribute("aria-label", "Copy key");
          copyBtn.innerHTML = ICON_COPY;
          copyBtn.addEventListener("click", function () {
            copyText(displayKey(k)).then(function () { showToast("Masked key copied"); });
          });

          var delBtn = document.createElement("button");
          delBtn.className = "icon-btn danger";
          delBtn.type = "button";
          delBtn.setAttribute("aria-label", "Delete key");
          delBtn.innerHTML = ICON_TRASH;
          delBtn.addEventListener("click", function () {
            if (!confirm("Delete this API key?")) return;
            if (!API_URL || !token) {
              showToast("Login required", true);
              return;
            }
            delBtn.disabled = true;
            dragoApiFetch(API_URL + "/api-keys/" + k.id, {
              method: "DELETE",
              headers: authHeaders()
            })
              .then(function (r) {
                return r.json().then(function (d) {
                  return { ok: r.ok, d: d };
                }).catch(function () {
                  return { ok: false, d: { message: "Server error " + r.status } };
                });
              })
              .then(function (res) {
                delBtn.disabled = false;
                if (!res.ok || !res.d.success) {
                  throw new Error((res.d && res.d.message) || "Delete failed");
                }
                showToast("Key deleted");
                loadKeys();
              })
              .catch(function (e) {
                delBtn.disabled = false;
                showToast(e.message || "Delete failed", true);
              });
          });

          icons.appendChild(eyeBtn);
          icons.appendChild(copyBtn);
          icons.appendChild(delBtn);

          row.appendChild(name);
          row.appendChild(scroll);
          row.appendChild(icons);
          keyList.appendChild(row);
        });
      }

      function loadKeys() {
        if (!API_URL || !token) {
          keyList.innerHTML = '<div class="empty-state">Login required to manage API keys.</div>';
          return;
        }
        dragoApiFetch(API_URL + "/api-keys", { headers: authHeaders() })
          .then(function (r) {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          })
          .then(function (data) { renderKeys(data.keys || []); loadUsage(); })
          .catch(function () {
            keyList.innerHTML = '<div class="empty-state">Could not load keys.</div>';
          });
      }

      createKeyBtn.addEventListener("click", function () {
        if (!API_URL || !token) {
          if (modalErr) modalErr.textContent = "Login required";
          return;
        }
        var name = (keyNameInput.value || "").trim();
        if (name.length < 4) {
          if (modalErr) modalErr.textContent = "Name must be at least 4 characters";
          if (keyNameInput) keyNameInput.focus();
          return;
        }
        if (modalErr) modalErr.textContent = "";
        createKeyBtn.disabled = true;
        dragoApiFetch(API_URL + "/api-keys", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ name: name })
        })
          .then(function (r) {
            return r.json().then(function (d) { return { ok: r.ok, d: d }; });
          })
          .then(function (res) {
            createKeyBtn.disabled = false;
            if (!res.ok || !res.d.success) {
              if (modalErr) modalErr.textContent = (res.d && res.d.message) || "Create failed";
              return;
            }
            closeModal();
            if (res.d.api_key) {
              try { window.prompt("Copy your API key now (shown once):", res.d.api_key); } catch (_) {}
              updateEndpointBoxes(res.d.api_key);
              showToast("API key created — copy it now");
            } else {
              showToast("API key created");
            }
            loadKeys();
          })
          .catch(function () {
            createKeyBtn.disabled = false;
            if (modalErr) modalErr.textContent = "Network error";
          });
      });

      if (keyNameInput) {
        keyNameInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") createKeyBtn.click();
        });
      }


      function setApiTab(which) {
        var isData = which === "data";
        var tabData = document.getElementById("tabData");
        var tabPred = document.getElementById("tabPred");
        var panelData = document.getElementById("panelData");
        var panelPred = document.getElementById("panelPred");
        if (tabData) tabData.classList.toggle("active", isData);
        if (tabPred) tabPred.classList.toggle("active", !isData);
        if (panelData) panelData.classList.toggle("active", isData);
        if (panelPred) panelPred.classList.toggle("active", !isData);
      }
      var tabDataBtn = document.getElementById("tabData");
      var tabPredBtn = document.getElementById("tabPred");
      if (tabDataBtn) tabDataBtn.addEventListener("click", function () { setApiTab("data"); });
      if (tabPredBtn) tabPredBtn.addEventListener("click", function () { setApiTab("pred"); });

      updateEndpointBoxes(null);
      loadKeys();
      loadUsage();
     
    })();

;

(function(){
    document.addEventListener("contextmenu", function(e){
      if (e.target && (e.target.tagName === "IMG" || e.target.closest("img"))) {
        e.preventDefault();
      }
    }, true);
    document.addEventListener("dragstart", function(e){
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    }, true);
  })();

;


