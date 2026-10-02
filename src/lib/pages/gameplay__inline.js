
;



;



;

(function () {
      var params = new URLSearchParams(window.location.search);
      var gameId = params.get("id");
      var nameParam = params.get("name");
      var headerName = document.getElementById("headerGameName");
      var webview = document.getElementById("gameWebview");
      var boxPeriod = document.getElementById("boxPeriod");
      var boxPred = document.getElementById("boxPred");

      function getApiUrl() {
        var raw = (window.__DRAGO_CONFIG__ || {}).API_URL || "";
        try {
          var u = new URL(raw);
          if (u.protocol === "https:") return raw.replace(/\/$/, "");
        } catch (_) {}
        return "";
      }

      /* Auto Bet Pro bridge. Auth stays in the parent app; the embedded game
         receives only an eligible-plan boolean and the current prediction. */
      var abBridgeWindow = null;
      var abBridgeOrigin = "";
      var abBridgeNonce = "";
      var abBridgeLastHello = 0;
      var abBridgeUser = null;
      var abBridgeUserAt = 0;
      var abBridgeActive = false;
      var abAutoBetPlans = ["beginners", "profit"];

      function isAutoBetPlan(user) {
        return !!(
          user &&
          user.is_pro &&
          abAutoBetPlans.indexOf(String(user.pro_plan || "").toLowerCase()) !== -1
        );
      }

      function sendAutoBetCard() {
        if (!abBridgeWindow || !abBridgeOrigin || !abBridgeNonce) return;
        var freshUser = abBridgeUser && Date.now() - abBridgeUserAt < 45000
          ? abBridgeUser
          : null;
        abBridgeActive = isAutoBetPlan(freshUser);
        try {
          abBridgeWindow.postMessage(
            { drago: "card", active: abBridgeActive, nonce: abBridgeNonce },
            abBridgeOrigin
          );
        } catch (e) {}
      }

      function updateAutoBetProfile(user) {
        abBridgeUser = user && typeof user === "object" ? user : null;
        abBridgeUserAt = Date.now();
        if (abBridgeWindow && Date.now() - abBridgeLastHello < 120000) {
          sendAutoBetCard();
        }
      }

      window.addEventListener("message", function (e) {
        var d = e.data;
        if (!d || typeof d !== "object" || d.drago !== "hello") return;
        if (!webview || e.source !== webview.contentWindow) return;
        if (typeof d.nonce !== "string" || d.nonce.length < 16 || d.nonce.length > 128) return;
        try {
          if (new URL(e.origin).protocol !== "https:") return;
        } catch (err) {
          return;
        }
        if (e.origin === "null") return;
        if (d.nonce === abBridgeNonce && Date.now() - abBridgeLastHello < 1000) return;

        abBridgeWindow = e.source;
        abBridgeOrigin = e.origin;
        abBridgeNonce = d.nonce;
        abBridgeLastHello = Date.now();
        sendAutoBetCard();
      });

      function normalizeAutoBetSignal(value) {
        var text = String(value || "").trim().toUpperCase();
        if (/^BIG\b/.test(text)) return "BIG";
        if (/^SMALL\b/.test(text)) return "SMALL";
        return "SKIP";
      }

      function bridgePush(signal, periodText, level, confidence, stale) {
        if (!abBridgeWindow || !abBridgeActive || !abBridgeNonce) return;
        if (Date.now() - abBridgeLastHello > 120000) return;
        var lvl = Number(level);
        if (!Number.isFinite(lvl) || lvl < 1) lvl = 1;
        lvl = Math.min(9, Math.floor(lvl));
        try {
          abBridgeWindow.postMessage(
            {
              drago: "pred",
              p: stale ? "SKIP" : normalizeAutoBetSignal(signal),
              per: periodText != null ? String(periodText) : "",
              lv: lvl,
              conf: confidence != null ? confidence : null,
              nonce: abBridgeNonce
            },
            abBridgeOrigin
          );
        } catch (e) {}
      }

      /* Pro-only gate — free users ko friendly message ke saath subscription pe bhejo.
         FIX: pehle expired-session PRO users ko bhi "PRO PLAN lo" dikhta tha.
         Ab: session expired → login; network error → grace (kick nahi);
         sirf genuinely non-pro → subscription redirect. */
      /* Bridge gate - prediction fetch/publish SIRF pro-confirm ke baad.
         The Auto Bet userscript receives plan status + signals through this bridge. */
      var proConfirmed = false;
      (function enforceProGameplay() {
        var api = getApiUrl();
        var token = sessionStorage.getItem("drago_token");
        var expiry = sessionStorage.getItem("drago_token_expiry");
        if (!token || (expiry && Number(expiry) < Date.now())) {
          try {
            sessionStorage.removeItem("drago_token");
            sessionStorage.removeItem("drago_token_expiry");
            sessionStorage.removeItem("drago_user");
          } catch (e) {}
          window.location.replace("../");
          return;
        }
        if (!api || !token) {
          window.location.replace("../game/");
          return;
        }
        var kickShown = false;
        function kick() {
          if (kickShown) return;
          kickShown = true;
          alert("Gameplay + Auto Bet Pro sirf Pro members ke liye hai.\n\nRX1 FOR BEGINNERS ya RX1 FOR PROFIT plan le kar abhi unlock karo.");
          window.location.replace("../subscription/");
        }
        function checkPro() {
          var t = sessionStorage.getItem("drago_token") || token;
          fetch("/api/account", {
            headers: { Authorization: "Bearer " + t, Accept: "application/json" },
            cache: "no-store",
            credentials: "same-origin",
          })
            .then(function (r) {
              if (r.status === 401 || r.status === 403) {
                // Invalid session or suspended account; never treat it as Free.
                window.location.replace("../");
                return null;
              }
              if (!r.ok) throw new Error("account_http_" + r.status);
              return r.json();
            })
            .then(function (data) {
              // Network/server failure is not proof of a Free plan; keep this check fail-closed
              // for protected data, but do not mislabel or redirect a valid account.
              if (!data || !data.success || !data.user) return;
              window.__DRAGO_USER__ = data.user;
              updateAutoBetProfile(data.user);
              if (data.user.is_pro) {
                // Pro confirmed -> ab background fetch/publish chalu
                if (!proConfirmed) {
                  proConfirmed = true;
                  fetchPrediction();
                }
              } else {
                kick();
              }
            })
            .catch(function () { /* transient network failure — retry on next interval */ });
        }
        checkPro();
        // Background re-check every 20s
        setInterval(checkPro, 20000);
      })();

      // Load game from server by id
      function loadGame() {
        var api = getApiUrl();
        if (gameId && api) {
          fetch(api + "/games/" + encodeURIComponent(gameId), { cache: "no-store" })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (data && data.success && data.game) {
                var g = data.game;
                document.title = "DRAGO • " + g.name;
                if (headerName) headerName.textContent = g.name;
                if (webview && g.link_url) webview.src = g.link_url;
              } else if (nameParam && headerName) {
                headerName.textContent = nameParam;
              }
            })
            .catch(function () {
              if (nameParam && headerName) headerName.textContent = nameParam;
            });
        } else if (nameParam) {
          document.title = "DRAGO • " + nameParam;
          if (headerName) headerName.textContent = nameParam;
        }
      }

      function pickPred(json) {
        if (!json || typeof json !== "object") return {};
        if (json.prediction && typeof json.prediction === "object") return json.prediction;
        if (json.data && json.data.prediction && typeof json.data.prediction === "object") {
          return json.data.prediction;
        }
        return json;
      }

      function updateBox(json) {
        var pred = pickPred(json) || {};
        var periodText =
          pred.period != null && pred.period !== ""
            ? String(pred.period)
            : "—";
        var raw =
          pred.prediction || pred.signal || pred.result || pred.value || "";
        var text = raw ? String(raw) : "—";
        var upper = text.toUpperCase();
        var predWrap = document.getElementById("boxPredWrap");

        if (boxPeriod) boxPeriod.textContent = periodText;
        if (boxPred) {
          boxPred.textContent = text;
          // BIG / SMALL / neutral — sab same dark color (skip jaisa)
          boxPred.className = "box-pred neutral";
        }
        if (predWrap) {
          predWrap.classList.remove("is-big", "is-small");
        }
        var level = pred.level != null ? pred.level : pred.lvl != null ? pred.lvl : 1;
        var confidence = pred.confidence != null ? pred.confidence : pred.conf != null ? pred.conf : null;
        bridgePush(raw, periodText, level, confidence, !!(json && json.stale));
      }

      var predInFlight = false;
      function fetchPrediction() {
        // Bridge gate: pro-confirm se pehle koi fetch nahi (non-pro/expired
        // session ke kick/redirect hone tak zero prediction traffic)
        if (!proConfirmed) return;
        var api = getApiUrl();
        if (!api || predInFlight) return;
        predInFlight = true;
        var token = sessionStorage.getItem("drago_token") || "";
        var doFetch =
          window.DRAGO_SEC && DRAGO_SEC.signedFetch
            ? function (u, i) { i = i || {}; i.mode = "auth"; return DRAGO_SEC.signedFetch(u, i); }
            : fetch;
        doFetch(api + "/wingo30s_prediction", {
          cache: "no-store",
          headers: { Authorization: "Bearer " + token },
        })
          .then(function (r) { return r.json(); })
          .then(function (json) {
            updateBox(json);
            publishPrediction(json);
          })
          .catch(function () {})
          .finally(function () {
            predInFlight = false;
          });
      }

      /* Predictions stay in the app page and are also forwarded to the
         origin-checked game-frame bridge after the server confirms access.
         The game receives a signal only—never the DRAGO login token or API key. */
      function publishPrediction(json) {
        var pred = pickPred(json) || {};
        var raw = pred.prediction || pred.signal || pred.result || pred.value || "";
        var snap = {
          period: pred.period != null ? String(pred.period) : "",
          signal: String(raw || "").toUpperCase(),
          level: pred.level != null ? pred.level : (pred.lvl != null ? pred.lvl : null),
          confidence: pred.confidence != null ? pred.confidence : (pred.conf != null ? pred.conf : null),
          stale: !!(json && json.stale),
          fetchedAt: Date.now(),
          source: "gameplay-page"
        };
        try {
          window.__DRAGO_PREDICTION__ = snap;
          window.__DRAGO_PREDICTION_HISTORY__ =
            (window.__DRAGO_PREDICTION_HISTORY__ || []).slice(-19).concat([snap]);
          document.dispatchEvent(
            new CustomEvent("drago:prediction", { detail: snap })
          );
        } catch (e) {}
      }

      // IST 30s boundary refresh (same idea as prediction page)
      function getISTDate() {
        var now = new Date();
        var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs + 5.5 * 3600000);
      }
      function getSecToNextBoundary() {
        var ist = getISTDate();
        var totalMs = ist.getSeconds() * 1000 + ist.getMilliseconds();
        if (totalMs < 30000) return Math.max(0, Math.ceil((30000 - totalMs) / 1000));
        return Math.max(0, Math.ceil((60000 - totalMs) / 1000));
      }
      var prevRemaining = null;
      setInterval(function () {
        var remaining = getSecToNextBoundary();
        if (prevRemaining !== null && remaining > prevRemaining) {
          setTimeout(fetchPrediction, 800);
        }
        prevRemaining = remaining;
      }, 250);

      loadGame();
      fetchPrediction();
      setInterval(fetchPrediction, 15000);

      var floatBall = document.getElementById("floatBall");
      var boxHide = document.getElementById("boxHide");
      var boxExit = document.getElementById("boxExit");

      function getFrameBounds() {
        var frame = document.querySelector(".drago-app-shell");
        var rect = frame ? frame.getBoundingClientRect() : null;
        return {
          left: rect ? rect.left : 0,
          top: 0,
          width: rect ? rect.width : window.innerWidth,
          height: window.innerHeight
        };
      }

      function clampToScreen(forceW, forceH) {
        if (!floatBall) return;
        var rect = floatBall.getBoundingClientRect();
        var bounds = getFrameBounds();
        var w = forceW || rect.width;
        var h = forceH || rect.height;
        var pad = 8;
        var minL = bounds.left + pad;
        var maxL = Math.max(minL, bounds.left + bounds.width - w - pad);
        var minT = pad;
        var maxT = Math.max(minT, bounds.height - h - pad);
        var left = rect.left;
        var top = rect.top;
        if (floatBall.style.left && floatBall.style.left !== "") {
          var styleLeft = parseFloat(floatBall.style.left);
          left = Number.isFinite(styleLeft) ? styleLeft : left;
        } else if (floatBall.style.right && floatBall.style.right !== "auto") {
          var rightGap = parseFloat(floatBall.style.right);
          left = window.innerWidth - w - (Number.isFinite(rightGap) ? rightGap : 16);
        }
        if (floatBall.style.top && floatBall.style.top !== "") {
          var styleTop = parseFloat(floatBall.style.top);
          top = Number.isFinite(styleTop) ? styleTop : top;
        } else if (floatBall.style.bottom && floatBall.style.bottom !== "auto") {
          var bottomGap = parseFloat(floatBall.style.bottom);
          top = window.innerHeight - h - (Number.isFinite(bottomGap) ? bottomGap : 28);
        }
        left = Math.min(Math.max(minL, left), maxL);
        top = Math.min(Math.max(minT, top), maxT);
        floatBall.style.left = left + "px";
        floatBall.style.top = top + "px";
        floatBall.style.right = "auto";
        floatBall.style.bottom = "auto";
      }

      function openBox() {
        if (!floatBall) return;
        var rect = floatBall.getBoundingClientRect();
        floatBall.style.left = rect.left + "px";
        floatBall.style.top = rect.top + "px";
        floatBall.style.right = "auto";
        floatBall.style.bottom = "auto";
        floatBall.classList.add("is-box");
        // Compact card ~228px wide, ~200px tall
        clampToScreen(228, 200);
        requestAnimationFrame(function () {
          clampToScreen();
          setTimeout(function () { clampToScreen(); }, 180);
        });
        fetchPrediction();
      }

      if (floatBall) {
        var dragging = false;
        var moved = false;
        var startX = 0, startY = 0, originLeft = 0, originTop = 0;

        function getPoint(e) {
          if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
          return { x: e.clientX, y: e.clientY };
        }

        function onStart(e) {
          // Buttons pe drag mat shuru karo — baaki poora box (header/body) drag ho
          if (e.target.closest && e.target.closest(".box-action")) return;
          var p = getPoint(e);
          dragging = true;
          moved = false;
          startX = p.x;
          startY = p.y;
          var rect = floatBall.getBoundingClientRect();
          originLeft = rect.left;
          originTop = rect.top;
          floatBall.classList.add("is-dragging");
          floatBall.style.left = originLeft + "px";
          floatBall.style.top = originTop + "px";
          floatBall.style.right = "auto";
          floatBall.style.bottom = "auto";
        }

        function onMove(e) {
          if (!dragging) return;
          var p = getPoint(e);
          var dx = p.x - startX;
          var dy = p.y - startY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
          var w = floatBall.offsetWidth;
          var h = floatBall.offsetHeight;
          var bounds = getFrameBounds();
          var minLeft = bounds.left;
          var maxLeft = Math.max(minLeft, bounds.left + bounds.width - w);
          var minTop = bounds.top;
          var maxTop = Math.max(minTop, bounds.height - h);
          var nx = Math.min(Math.max(minLeft, originLeft + dx), maxLeft);
          var ny = Math.min(Math.max(minTop, originTop + dy), maxTop);
          floatBall.style.left = nx + "px";
          floatBall.style.top = ny + "px";
          if (e.cancelable) e.preventDefault();
        }

        function onEnd() {
          if (!dragging) return;
          dragging = false;
          floatBall.classList.remove("is-dragging");
          if (!moved && !floatBall.classList.contains("is-box")) {
            openBox();
          } else {
            clampToScreen();
          }
        }

        floatBall.addEventListener("mousedown", onStart);
        floatBall.addEventListener("touchstart", onStart, { passive: true });
        window.addEventListener("mousemove", onMove);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchend", onEnd);
        window.addEventListener("resize", clampToScreen);
      }

      if (boxHide) {
        boxHide.addEventListener("click", function (e) {
          e.stopPropagation();
          if (floatBall) floatBall.classList.remove("is-box");
        });
      }
      if (boxExit) {
        boxExit.addEventListener("click", function (e) {
          e.stopPropagation();
          window.location.href = "../game/";
        });
      }

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


