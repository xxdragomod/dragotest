
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

      function escAttr(s) {
        return String(s || "")
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      var userIsPro = false;

      function checkProThen(cb) {
        var api = getApiUrl();
        var token = sessionStorage.getItem("drago_token");
        if (!api || !token) {
          userIsPro = false;
          if (cb) cb();
          return;
        }
        fetch("/api/account", {
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          cache: "no-store",
          credentials: "same-origin",
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            userIsPro = !!(data && data.user && data.user.is_pro);
            if (cb) cb();
          })
          .catch(function () {
            userIsPro = false;
            if (cb) cb();
          });
      }

      function showProOnlyAlert() {
        if (window.confirm("Ye feature sirf paid users ke liye hai.\n\nIse use karne ke liye PRO PLAN lo.")) {
          window.location.href = "../subscription/";
        }
      }

      var gameRowAutoScrollStates = [];
      var renderedGamesSignature = null;

      function stopGameRowAutoScroll() {
        gameRowAutoScrollStates.forEach(function (state) {
          state.destroyed = true;
          if (state.frame !== null) window.cancelAnimationFrame(state.frame);
          if (state.resumeTimer) window.clearTimeout(state.resumeTimer);
          state.row.classList.remove("is-auto-scrolling");
          state.row.removeEventListener("pointerdown", state.onPointerDown);
          state.row.removeEventListener("wheel", state.onWheel);
          state.row.removeEventListener("keydown", state.onKeyDown);
          window.removeEventListener("pointerup", state.onPointerUp);
          window.removeEventListener("pointercancel", state.onPointerUp);
        });
        gameRowAutoScrollStates = [];
      }

      function pauseGameRowAutoScroll(state) {
        if (state.frame !== null) {
          window.cancelAnimationFrame(state.frame);
          state.frame = null;
        }
        state.lastTime = 0;
        state.row.classList.remove("is-auto-scrolling");
      }

      function normalizeGameRowAutoScroll(state) {
        var distance = state.loopDistance;
        if (!distance) return;
        var position = (state.row.scrollLeft - distance) % distance;
        if (position < 0) position += distance;
        state.row.scrollLeft = distance + position;
      }

      function startGameRowAutoScroll(state) {
        if (state.destroyed || state.pointerActive || state.frame !== null || !state.row.isConnected) return;
        if (state.row.scrollWidth - state.row.clientWidth <= 2) return;

        state.row.classList.add("is-auto-scrolling");
        state.lastTime = 0;

        function tick(now) {
          if (state.destroyed || state.pointerActive || !state.row.isConnected) {
            state.frame = null;
            return;
          }

          var elapsed = state.lastTime ? Math.min(0.05, Math.max(0, (now - state.lastTime) / 1000)) : 0;
          state.lastTime = now;
          var distance = state.loopDistance;
          var next = state.row.scrollLeft + state.direction * state.speed * elapsed;
          // Repeated card groups let each row loop in one direction without a visible jump.
          if (state.direction > 0 && next >= distance * 2) next -= distance;
          else if (state.direction < 0 && next <= distance) next += distance;
          state.row.scrollLeft = next;
          state.frame = window.requestAnimationFrame(tick);
        }

        state.frame = window.requestAnimationFrame(tick);
      }

      function scheduleGameRowAutoScrollResume(state) {
        if (state.destroyed || state.pointerActive) return;
        if (state.resumeTimer) window.clearTimeout(state.resumeTimer);
        state.resumeTimer = window.setTimeout(function () {
          state.resumeTimer = 0;
          normalizeGameRowAutoScroll(state);
          startGameRowAutoScroll(state);
        }, 5000);
      }

      function setupGameRowAutoScroll(grid) {
        stopGameRowAutoScroll();
        Array.prototype.forEach.call(grid.querySelectorAll(".games-row"), function (row, index) {
          var track = row.querySelector(".games-row-track");
          var firstGroup = track && track.querySelector(".games-row-group");
          if (!track || !firstGroup) return;

          var loopDistance = firstGroup.getBoundingClientRect().width;
          if (loopDistance <= 2) return;
          var copyCount = Math.max(3, Math.ceil(row.clientWidth / loopDistance) + 2);

          for (var copyIndex = 1; copyIndex < copyCount; copyIndex++) {
            var copy = firstGroup.cloneNode(true);
            copy.classList.add("games-row-group-copy");
            copy.setAttribute("aria-hidden", "true");
            copy.querySelectorAll("a").forEach(function (link) {
              link.setAttribute("tabindex", "-1");
              link.addEventListener("click", function (event) {
                if (!userIsPro) {
                  event.preventDefault();
                  showProOnlyAlert();
                }
              });
            });
            track.appendChild(copy);
          }

          // Even rows move right-to-left; odd rows move left-to-right.
          var direction = index % 2 === 0 ? 1 : -1;
          row.setAttribute("role", "region");
          row.setAttribute("aria-label", "Game row " + (index + 1));
          row.setAttribute("tabindex", "0");
          row.classList.add("is-auto-scrolling");
          row.scrollLeft = direction > 0 ? loopDistance : loopDistance * 2;

          var state = {
            row: row,
            direction: direction,
            loopDistance: loopDistance,
            speed: 24,
            frame: null,
            lastTime: 0,
            resumeTimer: 0,
            pointerActive: false,
            destroyed: false
          };

          state.onPointerDown = function () {
            state.pointerActive = true;
            if (state.resumeTimer) {
              window.clearTimeout(state.resumeTimer);
              state.resumeTimer = 0;
            }
            pauseGameRowAutoScroll(state);
          };
          state.onPointerUp = function () {
            if (!state.pointerActive) return;
            state.pointerActive = false;
            scheduleGameRowAutoScrollResume(state);
          };
          state.onWheel = function () {
            if (state.pointerActive) return;
            pauseGameRowAutoScroll(state);
            scheduleGameRowAutoScrollResume(state);
          };
          state.onKeyDown = function (event) {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) === -1) return;
            event.preventDefault();
            pauseGameRowAutoScroll(state);
            var step = Math.max(90, Math.round(row.clientWidth * 0.6));
            var target = row.scrollLeft;
            if (event.key === "ArrowLeft") target -= step;
            if (event.key === "ArrowRight") target += step;
            if (event.key === "Home") target = 0;
            if (event.key === "End") target = Math.max(0, row.scrollWidth - row.clientWidth);
            row.scrollTo({ left: target, behavior: "smooth" });
            scheduleGameRowAutoScrollResume(state);
          };

          row.addEventListener("pointerdown", state.onPointerDown, { passive: true });
          row.addEventListener("wheel", state.onWheel, { passive: true });
          row.addEventListener("keydown", state.onKeyDown);
          window.addEventListener("pointerup", state.onPointerUp, { passive: true });
          window.addEventListener("pointercancel", state.onPointerUp, { passive: true });
          gameRowAutoScrollStates.push(state);
          startGameRowAutoScroll(state);
        });
      }

      function showGamesMessage(grid, message) {
        stopGameRowAutoScroll();
        renderedGamesSignature = null;
        if (grid) grid.innerHTML = '<div class="games-empty">' + message + '</div>';
      }

      function renderGames(games) {
        var grid = document.getElementById("gamesGrid");
        if (!grid) return;

        if (!games || !games.length) {
          showGamesMessage(grid, "No games yet. Add via Telegram /addgame");
          renderedGamesSignature = "[]";
          return;
        }

        var signature = JSON.stringify(games.map(function (g) {
          return [String(g.id == null ? "" : g.id), String(g.name || ""), String(g.image_url || "")];
        }));
        if (signature === renderedGamesSignature && grid.querySelector(".games-row")) return;

        stopGameRowAutoScroll();
        renderedGamesSignature = signature;

        // Keep the existing three-row layout; rows auto-pan in alternating directions.
        var rows = [[], [], []];
        var perRow = Math.ceil(games.length / 3);
        games.forEach(function (g, i) {
          var rowIdx = Math.min(2, Math.floor(i / perRow));
          rows[rowIdx].push(g);
        });

        grid.innerHTML = "";
        rows.forEach(function (rowGames, rowIndex) {
          var row = document.createElement("div");
          row.className = "games-row";
          row.setAttribute("role", "region");
          row.setAttribute("aria-label", "Game row " + (rowIndex + 1));

          if (rowGames.length) {
            var track = document.createElement("div");
            track.className = "games-row-track";
            var group = document.createElement("div");
            group.className = "games-row-group";
            track.appendChild(group);
            row.appendChild(track);

            rowGames.forEach(function (g) {
              var a = document.createElement("a");
              a.className = "game-card";
              a.href = "../gameplay/?id=" + encodeURIComponent(g.id);
              var imgSrc = localGameIcon(g.id, g.image_url);
              a.innerHTML =
                '<img src="' + escAttr(imgSrc) + '" alt="' + escAttr(g.name) + '" width="120" height="120" decoding="async" loading="eager" />' +
                '<div class="game-name">' + escAttr(g.name) + "</div>";
              a.addEventListener("click", function (e) {
                if (!userIsPro) {
                  e.preventDefault();
                  showProOnlyAlert();
                }
              });
              group.appendChild(a);
            });
          } else {
            row.style.minHeight = "0";
          }

          grid.appendChild(row);
        });

        setupGameRowAutoScroll(grid);
      }

function loadGames() {
        var api = getApiUrl();
        var grid = document.getElementById("gamesGrid");
        if (!api) {
          showGamesMessage(grid, "API not configured");
          return;
        }
        fetch(api + "/games", { cache: "no-store" })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || !data.success) {
              showGamesMessage(grid, "Could not load games");
              return;
            }
            renderGames(data.games || []);
          })
          .catch(function () {
            showGamesMessage(grid, "Network error");
          });
      }

      /* ============================================================
         FIX: loadGameIconManifest() aur localGameIcon() code me kahin
         defined hi nahi the. Isliye ReferenceError aata tha aur
         loadGames() kabhi call hi nahi hota tha — game grid hamesha
         "Loading games…" pe atka rehta tha.
         ============================================================ */
      var gameIconManifest = {};

      function loadGameIconManifest() {
        return fetch("/assets/games/manifest.json", { cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (m) {
            gameIconManifest = (m && typeof m === "object") ? m : {};
          })
          .catch(function () { gameIconManifest = {}; });
      }

      // API ka game id manifest ke key se 1:1 match karta hai
      // (id 1 → "GOA GAME" → /assets/games/game_1.webp)
      function localGameIcon(id, remoteUrl) {
        var key = String(id == null ? "" : id).trim();
        var entry = gameIconManifest[key] || null;
        if (entry && entry.path) return entry.path;      // local .webp — fast + cached
        if (remoteUrl) return remoteUrl;                 // API wala image_url
        if (entry && entry.remote) return entry.remote;  // manifest ka remote fallback
        return "";
      }

      checkProThen(function () {
        loadGameIconManifest().then(function () { loadGames(); });
      });
      setInterval(loadGames, 60000);
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


