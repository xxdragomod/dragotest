
;



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

      function getApiUrl() {
        var raw = (window.__DRAGO_CONFIG__ || {}).API_URL || "";
        try {
          var u = new URL(raw);
          if (u.protocol === "https:") return raw.replace(/\/$/, "");
        } catch (_) {}
        return "";
      }

      function authHeaders() {
        var t = sessionStorage.getItem("drago_token") || "";
        return { Authorization: "Bearer " + t };
      }

      // ACTIVITY STATUS bars — smooth height animation on update
      var bars = document.getElementById("chartBars");
      function renderActivityBars(animate) {
        if (!bars) return;
        var html = "";
        for (var i = 0; i < 16; i++) {
          var h = 18 + Math.round(Math.random() * 82);
          var delay = (i * 0.03).toFixed(2);
          html +=
            '<i style="height:' +
            h +
            "%;animation-delay:" +
            delay +
            's"></i>';
        }
        bars.classList.remove("animating");
        bars.innerHTML = html;
        if (animate) {
          void bars.offsetWidth;
          bars.classList.add("animating");
        }
      }
      renderActivityBars(false);
      setInterval(function () {
        renderActivityBars(true);
      }, 4000);

      function loadDash() {
        var api = getApiUrl();
        if (!api) return;

        fetch("/api/account", {
          headers: Object.assign({ Accept: "application/json" }, authHeaders()),
          cache: "no-store",
          credentials: "same-origin"
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || !data.success || !data.user) return;
            var u = data.user;
            var isPro = !!u.is_pro;
            var pill = document.getElementById("planPill");
            if (pill) {
              pill.textContent = isPro ? "PRO" : "FREE";
              pill.className = "plan-pill " + (isPro ? "pro" : "free");
            }
            var planEl = document.getElementById("statPlan");
            if (planEl) planEl.textContent = isPro ? "Pro" : "Free";
            var planSub = document.getElementById("statPlanSub");
            if (planSub) planSub.textContent = u.plan_label || (isPro ? "Active" : "Upgrade available");

            var predLeft = document.getElementById("statPredLeft");
            var predSub = document.getElementById("statPredSub");
            if (isPro) {
              if (predLeft) predLeft.textContent = "∞";
              if (predSub) predSub.textContent = "Unlimited";
            } else {
              var rem = u.free_pred_remaining != null ? u.free_pred_remaining : 3;
              if (predLeft) predLeft.textContent = String(rem);
              if (predSub) predSub.textContent = (u.free_pred_used || 0) + " / " + (u.free_pred_limit || 3) + " used";
            }

            var apiLeft = document.getElementById("statApiLeft");
            var apiSub = document.getElementById("statApiSub");
            if (isPro) {
              if (apiLeft) apiLeft.textContent = "20/m";
              if (apiSub) apiSub.textContent = "Per endpoint";
            } else {
              var used = u.api_history_used || 0;
              var lim = u.api_history_limit || 10;
              if (apiLeft) apiLeft.textContent = String(Math.max(0, lim - used));
              if (apiSub) apiSub.textContent = used + " / " + lim + " used";
            }

            var note = document.getElementById("billingNote");
            if (note) {
              if (!isPro && (u.free_pred_remaining === 0 || (u.api_history_used || 0) >= (u.api_history_limit || 10))) {
                note.className = "api-note warn";
                note.innerHTML = 'Limit reached — <a href="../subscription/" style="color:#f0c060;font-weight:700;">Get Pro Plan</a>';
              } else if (!isPro) {
                note.className = "api-note";
                note.textContent = "Free: 3 predictions + 10 API history fetches. Upgrade for unlimited.";
              } else {
                note.className = "api-note";
                note.textContent = "Pro active — unlimited predictions & 20 req/min API.";
              }
            }
          })
          .catch(function () {});

        fetch(api + "/system-status", { headers: authHeaders() })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || !data.success) return;
            var pct = data.health_percent || 0;
            var el = document.getElementById("statHealth");
            if (el) el.textContent = pct + "%";
            var pctEl = document.getElementById("healthPct");
            if (pctEl) pctEl.textContent = pct + "%";
            var bar = document.getElementById("healthBar");
            if (bar) bar.style.width = pct + "%";
            var hn = document.getElementById("healthNote");
            if (hn) hn.textContent = "Last checked just now · " + (data.checks ? data.checks.length : 0) + " services";
          })
          .catch(function () {});
      }

      loadDash();
      setInterval(loadDash, 60000);
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


