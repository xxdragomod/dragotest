
;



;



;

(function () {

      var menuBtn = document.getElementById("menuBtn");
      var sideDrawer = document.getElementById("sideDrawer");
      var drawerOverlay = document.getElementById("drawerOverlay");
      var drawerClose = document.getElementById("drawerClose");


      function openDrawer() {

        if (sideDrawer) {
          sideDrawer.classList.add("open");
          sideDrawer.setAttribute("aria-hidden", "false");
        }

        if (drawerOverlay) {
          drawerOverlay.classList.add("show");
        }

        if (menuBtn) {
          menuBtn.setAttribute("aria-expanded", "true");
        }

        document.body.classList.add("drawer-open");
      }


      function closeDrawer() {

        if (sideDrawer) {
          sideDrawer.classList.remove("open");
          sideDrawer.setAttribute("aria-hidden", "true");
        }

        if (drawerOverlay) {
          drawerOverlay.classList.remove("show");
        }

        if (menuBtn) {
          menuBtn.setAttribute("aria-expanded", "false");
        }

        document.body.classList.remove("drawer-open");
      }


      if (menuBtn) {
        menuBtn.addEventListener("click", openDrawer);
      }

      if (drawerClose) {
        drawerClose.addEventListener("click", closeDrawer);
      }

      if (drawerOverlay) {
        drawerOverlay.addEventListener("click", closeDrawer);
      }
function getApiUrl() {

        var raw =
          (window.__DRAGO_CONFIG__ || {}).API_URL || "";

        try {

          var u = new URL(raw);

          if (u.protocol === "https:") {
            return raw.replace(/\/$/, "");
          }

        } catch (_) {}

        return "";
      }


      function formatUptime(sec) {

        sec = Math.max(0, Number(sec) || 0);

        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;

        if (h > 0) {
          return h + "h " + m + "m";
        }

        if (m > 0) {
          return m + "m " + s + "s";
        }

        return s + "s";
      }


      function loadStatus() {

        var token =
          sessionStorage.getItem("drago_token");

        var api =
          getApiUrl();

        var list =
          document.getElementById("checkList");


        if (!token || !api) {

          if (list) {
            list.innerHTML =
              '<div class="status-loading">API not configured</div>';
          }

          return;
        }


        fetch(
          api + "/system-status",
          {
            headers: {
              Authorization: "Bearer " + token
            }
          }
        )

        .then(function (r) {
          return r.json();
        })

        .then(function (data) {

          if (!data || !data.success) {

            if (list) {
              list.innerHTML =
                '<div class="status-loading">Could not load status</div>';
            }

            return;
          }


          var pct =
            data.health_percent || 0;

          var pctEl =
            document.getElementById("healthPct");

          var bar =
            document.getElementById("healthBar");

          var up =
            document.getElementById("uptimeText");


          if (pctEl) {
            pctEl.textContent =
              pct + "%";
          }


          if (bar) {
            bar.style.width = pct + "%";
            bar.style.setProperty(
              "--fill-pct",
              pct + "%"
            );
          }


          if (up) {
            up.textContent =
              "Uptime: " +
              formatUptime(data.uptime_sec);
          }


          /*
           * Get all checks from API
           */
          var checks =
            data.checks || [];


          /* Hide secret / internal service cards */
          var hiddenIds = [
            "manual_qr",
            "games",
            "prediction"
          ];
          var hiddenLabels = [
            "manual qr",
            "games catalog",
            "prediction source",
            "prediction shource"
          ];

          checks.forEach(function (c) {
            var label = String(c.label || "");
            var id = String(c.id || "");
            if (
              label.toLowerCase().includes("sqlite") ||
              id.toLowerCase().includes("sqlite")
            ) {
              c.label = "Database";
              c.__displayName = "Database";
            }
            if (
              label.toLowerCase().includes("telegram") ||
              id === "telegram"
            ) {
              c.label = "Help Support";
              c.__displayName = "Help Support";
            }
            /* Never show real URLs / hosts to users */
            c.url = "";
          });

          checks = checks.filter(function (c) {
            var id = String(c.id || "").toLowerCase();
            var label = String(c.label || "").toLowerCase();
            if (hiddenIds.indexOf(id) !== -1) return false;
            for (var i = 0; i < hiddenLabels.length; i++) {
              if (label.indexOf(hiddenLabels[i]) !== -1) return false;
            }
            return true;
          });


          if (!list) {
            return;
          }


          list.innerHTML = "";


          var GLOBE_SVG =
            '<svg viewBox="0 0 24 24" fill="none" stroke="#e8973a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="12" r="10"/>' +
              '<line x1="2" y1="12" x2="22" y2="12"/>' +
              '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
            '</svg>';


          var CLOCK_SVG =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="12" r="10"/>' +
              '<polyline points="12 6 12 12 16 14"/>' +
            '</svg>';


          checks.forEach(function (c) {

            var ok =
              !!c.ok;


            var latency =
              c.latency_ms != null
                ? c.latency_ms + "ms"
                : (c.detail || "—");


            var uptimePct =
              c.percent != null
                ? c.percent
                : 100;


            var lastChecked =
              c.last_checked ||
              "just now";


            /*
             * History
             */
            var history =
              Array.isArray(c.history) &&
              c.history.length
                ? c.history
                : new Array(48).fill(ok);


            var stripes =
              history.map(function (h, idx) {

                var delay =
                  (idx * 0.012).toFixed(3);


                return (
                  '<i class="' +
                  (h ? "up" : "down") +
                  '" style="animation-delay:' +
                  delay +
                  's"></i>'
                );

              }).join("");


            var el =
              document.createElement("div");


            el.className =
              "check-item";


            el.innerHTML =

              '<div class="check-top">' +

                '<div class="check-icon">' +
                  GLOBE_SVG +
                '</div>' +

                '<div class="check-heading">' +

                  '<span class="check-name"></span>' +

                  '<span class="check-url"></span>' +

                '</div>' +

              '</div>' +


              '<div class="check-stats">' +

                '<span class="check-latency">' +
                  CLOCK_SVG +
                  '<span></span>' +
                '</span>' +

                '<span class="check-badge ' +
                  (ok ? "ok" : "bad") +
                '">' +
                  (ok ? "Operational" : "Down") +
                '</span>' +

              '</div>' +


              '<div class="check-meta">' +

                '<span>Last checked ' +
                  lastChecked +
                '</span>' +

                '<span class="uptime-val">' +
                  uptimePct +
                  '% uptime' +
                '</span>' +

              '</div>' +


              '<div class="mini-bar">' +
                stripes +
              '</div>';


            /*
             * Display name
             * SQLite will show as Database
             */
            el.querySelector(
              ".check-name"
            ).textContent =
              c.__displayName ||
              c.label ||
              c.id;


            /* Response time only — no host / URL values */
            var urlEl = el.querySelector(".check-url");
            if (urlEl) {
              urlEl.textContent =
                c.latency_ms != null
                  ? c.latency_ms + "ms"
                  : "";
            }


            el.querySelector(
              ".check-latency span"
            ).textContent =
              latency;


            list.appendChild(el);

          });


          /*
           * If no visible checks remain
           */
          if (!checks.length) {

            list.innerHTML =
              '<div class="status-loading">No website status available</div>';

          }

        })


        .catch(function () {

          if (list) {

            list.innerHTML =
              '<div class="status-loading">Network error</div>';

          }

        });

      }


      /*
       * Load status immediately
       */
      loadStatus();


      /*
       * Refresh every 30 seconds
       */
      setInterval(
        loadStatus,
        30000
      );

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


