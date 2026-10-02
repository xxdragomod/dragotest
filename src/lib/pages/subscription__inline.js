
;



;

function dragoApiFetch(url, init) {
    init = init || {};
    init.mode = init.mode || "auth";
    if (url.indexOf("/create-payment") >= 0 || url.indexOf("/manual-payment") >= 0 || url.indexOf("/order-status") >= 0 || url.indexOf("/payment-") >= 0) {
      init.mode = "payment";
    }
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
      /* Drawer */
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
/* Plans popup */
      var plansOverlay = document.getElementById("plansOverlay");
      var purchaseBtn = document.getElementById("purchaseBtn");
      var plansClose = document.getElementById("plansClose");

      function openPlans() {
        if (plansOverlay) {
          plansOverlay.classList.add("show");
          plansOverlay.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }
      }
      function closePlans() {
        if (plansOverlay) {
          plansOverlay.classList.remove("show");
          plansOverlay.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }
      }

      if (purchaseBtn) purchaseBtn.addEventListener("click", openPlans);
      if (plansClose) plansClose.addEventListener("click", closePlans);
      if (plansOverlay) {
        plansOverlay.addEventListener("click", function (e) {
          if (e.target === plansOverlay) closePlans();
        });
      }

      /* Payment: sirf backend API — token frontend pe nahi */
      function getApiUrl() {
        var raw = (window.__DRAGO_CONFIG__ || {}).API_URL || "";
        try {
          var u = new URL(raw);
          if (u.protocol === "https:") return raw.replace(/\/$/, "");
        } catch (_) {}
        return "";
      }

      var payLoading = document.getElementById("payLoading");
      function showPayLoading() {
        if (payLoading) {
          payLoading.classList.add("show");
          payLoading.setAttribute("aria-hidden", "false");
        }
      }
      function hidePayLoading() {
        if (payLoading) {
          payLoading.classList.remove("show");
          payLoading.setAttribute("aria-hidden", "true");
        }
      }
      hidePayLoading();
      window.addEventListener("pageshow", function () { hidePayLoading(); });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") hidePayLoading();
      });


      /* Custom QR gateway — QR & amounts from backend /payment-config only */
      var PLAN_AMOUNTS = {
        test: 300,
        beginners: 500,
        profit: 900
      };
      var customPayOverlay = document.getElementById("customPayOverlay");
      var customPayClose = document.getElementById("customPayClose");
      var customPaidBtn = document.getElementById("customPaidBtn");
      var customUtrInput = document.getElementById("customUtrInput");
      var customPendingPlan = null;
      var customPendingAmount = 0;
      var customPendingOrderId = null;

      var customTimerIv = null;
      function fmtMmSs(sec) {
        sec = Math.max(0, Math.floor(Number(sec) || 0));
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
      }
      function startCustomPayTimer(expiresInSec) {
        var el = document.getElementById("customPayTimer");
        var left = Number(expiresInSec);
        if (!Number.isFinite(left) || left <= 0) left = 600;
        if (customTimerIv) clearInterval(customTimerIv);
        function tick() {
          if (el) el.textContent = "Valid for " + fmtMmSs(left);
          left -= 1;
          if (left < 0 && customTimerIv) {
            clearInterval(customTimerIv);
            customTimerIv = null;
            if (el) el.textContent = "Expired — start again";
          }
        }
        tick();
        customTimerIv = setInterval(tick, 1000);
      }
      function setCustomPayMeta(orderId, expiresInSec) {
        var idEl = document.getElementById("customPayOrderId");
        if (idEl) idEl.textContent = orderId ? ("Payment ID: " + orderId) : "";
        startCustomPayTimer(expiresInSec);
      }

      function openCustomPay(planKey, reason, existingOrder) {
        // existingOrder can be order_id string OR order object from history
        var existingOrderId = null;
        var resumeExpires = 600;
        if (existingOrder && typeof existingOrder === "object") {
          existingOrderId = existingOrder.order_id || null;
          if (existingOrder.expires_in_sec != null) resumeExpires = existingOrder.expires_in_sec;
          if (existingOrder.plan) planKey = existingOrder.plan;
          if (existingOrder.amount != null) customPendingAmount = existingOrder.amount;
        } else {
          existingOrderId = existingOrder || null;
        }
        customPendingPlan = planKey || null;
        customPendingAmount = PLAN_AMOUNTS[planKey] || customPendingAmount || 0;
        customPendingOrderId = existingOrderId || null;
        var amountEl = document.getElementById("customPayAmount");
        var qrImg = document.getElementById("customQrImg");
        var banner = document.getElementById("customPayBanner");

        if (amountEl) amountEl.textContent = String(customPendingAmount);
        if (banner) {
          banner.textContent = reason
            ? reason
            : "Primary gateway is unavailable. Scan the QR below to pay.";
        }
        if (qrImg) {
          qrImg.removeAttribute("src");
          qrImg.alt = "Loading QR…";
        }
        if (customUtrInput) {
          customUtrInput.value = "";
          customUtrInput.classList.remove("error");
        }
        setCustomPayMeta(customPendingOrderId, resumeExpires);

        closePlans();
        if (customPayOverlay) {
          customPayOverlay.classList.add("show");
          customPayOverlay.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }

        var token = sessionStorage.getItem("drago_token");
        var api = getApiUrl();
        if (!token || !api || !planKey) return;

        // Resume existing order → only load QR config
        if (existingOrderId) {
          customPendingOrderId = existingOrderId;
          setCustomPayMeta(existingOrderId, resumeExpires);
          dragoApiFetch(
            api + "/payment-config?plan=" + encodeURIComponent(planKey),
            { headers: { Authorization: "Bearer " + token } }
          )
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              if (!data || !data.success) return;
              if (data.amount != null) {
                customPendingAmount = data.amount;
                if (amountEl) amountEl.textContent = String(data.amount);
              }
              if (qrImg && data.qr_url) {
                qrImg.src = data.qr_url;
                qrImg.alt = "UPI QR Code";
              }
            })
            .catch(function () {});
          return;
        }

        // New session → create PENDING order so history + Continue work
        dragoApiFetch(api + "/manual-payment/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify({ plan: planKey })
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (!data || !data.success) return;
            customPendingOrderId = data.order_id || null;
            setCustomPayMeta(customPendingOrderId, data.ttl_minutes ? data.ttl_minutes * 60 : 600);
            if (data.amount != null) {
              customPendingAmount = data.amount;
              if (amountEl) amountEl.textContent = String(data.amount);
            }
            if (qrImg && data.qr_url) {
              qrImg.src = data.qr_url;
              qrImg.alt = "UPI QR Code";
            }
          })
          .catch(function () {
            // fallback config only
            dragoApiFetch(
              api + "/payment-config?plan=" + encodeURIComponent(planKey),
              { headers: { Authorization: "Bearer " + token } }
            )
              .then(function (r) {
                return r.json();
              })
              .then(function (data) {
                if (!data || !data.success) return;
                if (qrImg && data.qr_url) qrImg.src = data.qr_url;
              })
              .catch(function () {});
          });
      }

      function closeCustomPay(force) {
        if (!force) {
          var ok = window.confirm(
            "Close this payment? You can resume from history within 10 minutes if still pending."
          );
          if (!ok) return;
        }
        if (customPayOverlay) {
          customPayOverlay.classList.remove("show");
          customPayOverlay.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }
      }

      if (customPayClose) {
        customPayClose.addEventListener("click", function () {
          closeCustomPay(false);
        });
      }
      if (customPayOverlay) {
        customPayOverlay.addEventListener("click", function (e) {
          if (e.target === customPayOverlay) closeCustomPay(false);
        });
      }

      // App buttons: open UPI app chooser (amount only — no UPI ID on screen)
      document.querySelectorAll(".upi-app-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          alert(
            "Open your UPI app and scan the QR above to pay ₹" +
              (customPendingAmount || "") +
              "."
          );
        });
      });

      if (customPaidBtn) {
        customPaidBtn.addEventListener("click", function () {
          var utr = (customUtrInput && customUtrInput.value
            ? customUtrInput.value
            : ""
          ).replace(/\s+/g, "").trim();

          if (!utr || utr.length < 8) {
            if (customUtrInput) {
              customUtrInput.classList.add("error");
              customUtrInput.focus();
            }
            alert("Please enter the UTR / Transaction ID from your UPI app.");
            return;
          }
          if (customUtrInput) customUtrInput.classList.remove("error");

          var token = sessionStorage.getItem("drago_token");
          var api = getApiUrl();
          if (!token || !api) {
            alert("Login required");
            return;
          }

          customPaidBtn.disabled = true;
          customPaidBtn.textContent = "Submitting…";

          dragoApiFetch(api + "/manual-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token
            },
            body: JSON.stringify({
              plan: customPendingPlan,
              amount: customPendingAmount,
              utr: utr,
              order_id: customPendingOrderId || undefined
            })
          })
            .then(function (r) {
              return r.json().then(function (data) {
                return { ok: r.ok, data: data };
              });
            })
            .then(function (res) {
              customPaidBtn.disabled = false;
              customPaidBtn.textContent = "I have paid";
              if (!res.ok || !res.data || !res.data.success) {
                alert(
                  (res.data && res.data.message) ||
                    "Submit failed. Check UTR and try again."
                );
                return;
              }
              alert(
                "UTR submitted. Your plan will activate after admin approval.\nUTR: " +
                  utr
              );
              closeCustomPay(true);
            })
            .catch(function () {
              customPaidBtn.disabled = false;
              customPaidBtn.textContent = "I have paid";
              alert("Network error. Please try again.");
            });
        });
      }

      document.querySelectorAll(".plan-option").forEach(function (el) {
        el.addEventListener("click", function () {
          var key = el.getAttribute("data-plan");
          if (!key) return;

          var token = sessionStorage.getItem("drago_token");
          if (!token) {
            window.location.replace("../");
            return;
          }

          var api = getApiUrl();
          if (!api) {
            alert("API not configured");
            return;
          }

          el.style.opacity = "0.6";
          el.style.pointerEvents = "none";
          showPayLoading();

          dragoApiFetch(api + "/create-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token
            },
            body: JSON.stringify({ plan: key })
          })
            .then(function (r) {
              return r.json().then(function (data) {
                return { ok: r.ok, data: data };
              });
            })
            .then(function (res) {
              el.style.opacity = "";
              el.style.pointerEvents = "";
              if (!res.ok || !res.data || !res.data.success || !res.data.payment_url) {
                hidePayLoading();
                // Gateway inactive / fail → custom QR gateway
                openCustomPay(
                  key,
                  "Primary payment gateway is inactive. Scan the QR to pay."
                );
                return;
              }
              window.location.href = res.data.payment_url;
            })
            .catch(function () {
              hidePayLoading();
              el.style.opacity = "";
              el.style.pointerEvents = "";
              openCustomPay(
                key,
                "Could not reach the payment gateway. Scan the QR to pay."
              );
            });
        });
      });

      /* Payment history sheet */
      var histOverlay = document.getElementById("histOverlay");
      var histList = document.getElementById("histList");
      var historyBtn = document.getElementById("historyBtn");
      var histClose = document.getElementById("histClose");

      var PLAN_LABELS = {
        test: "RX1 FOR TEST",
        beginners: "RX1 FOR BEGINNERS",
        profit: "RX1 FOR PROFIT"
      };

      var pendingBanner = document.getElementById("pendingPayBanner");
      var ppPlanName = document.getElementById("ppPlanName");
      var ppOrderIdEl = document.getElementById("ppOrderId");
      var ppTimer = document.getElementById("ppTimer");
      var ppContinue = document.getElementById("ppContinue");
      var ppCloseBtn = document.getElementById("ppCloseBtn");
      var activePending = null;
      var pendingTimerIv = null;

      function hidePendingBanner() {
        if (pendingBanner) {
          pendingBanner.classList.remove("show");
          pendingBanner.setAttribute("aria-hidden", "true");
        }
        activePending = null;
        if (pendingTimerIv) { clearInterval(pendingTimerIv); pendingTimerIv = null; }
        document.body.style.overflow = "";
      }
      function showPendingBanner(order) {
        if (!order || !pendingBanner) return;
        activePending = order;
        var label = PLAN_LABELS[order.plan] || order.plan || "Plan";
        if (ppPlanName) ppPlanName.textContent = label + (order.amount != null ? " · ₹" + order.amount : "");
        if (ppOrderIdEl) ppOrderIdEl.textContent = "Payment ID: " + (order.order_id || "—");
        var left = Number(order.expires_in_sec);
        if (!Number.isFinite(left)) left = 600;
        function tick() {
          if (ppTimer) ppTimer.textContent = "Valid for " + fmtMmSs(left);
          left -= 1;
          if (left < 0) hidePendingBanner();
        }
        tick();
        if (pendingTimerIv) clearInterval(pendingTimerIv);
        pendingTimerIv = setInterval(tick, 1000);
        pendingBanner.classList.add("show");
        pendingBanner.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
      function loadPendingPayment() {
        var api = getApiUrl();
        var token = sessionStorage.getItem("drago_token") || "";
        if (!api || !token) return;
        dragoApiFetch(api + "/payment-history", {
          headers: { Authorization: "Bearer " + token }
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data || !data.success) return;
            var orders = data.orders || data.items || [];
            var hit = null;
            for (var i = 0; i < orders.length; i++) {
              var o = orders[i];
              var st = String(o.payment_status || "").toUpperCase();
              if (st === "PENDING" && o.can_continue) { hit = o; break; }
            }
            if (hit) showPendingBanner(hit);
            else hidePendingBanner();
          })
          .catch(function () {});
      }
      if (ppCloseBtn) ppCloseBtn.addEventListener("click", hidePendingBanner);
      if (pendingBanner) {
        pendingBanner.addEventListener("click", function (e) {
          if (e.target === pendingBanner) hidePendingBanner();
        });
      }
      if (ppContinue) {
        ppContinue.addEventListener("click", function () {
          if (!activePending) return;
          var o = activePending;
          if (o.continue_mode === "manual" || (!o.payment_url && o.plan)) {
            openCustomPay(o.plan, "Continue your pending payment (valid 10 min)", o);
          } else if (o.payment_url) {
            showPayLoading();
            window.location.href = o.payment_url;
          }
        });
      }
      loadPendingPayment();


      function openHistory() {
        if (histOverlay) {
          histOverlay.classList.add("show");
          histOverlay.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }
        loadHistory();
      }
      function closeHistory() {
        if (histOverlay) {
          histOverlay.classList.remove("show");
          histOverlay.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }
      }

      function statusBadge(st) {
        var s = String(st || "PENDING").toUpperCase();
        if (s === "SUCCESS" || s === "PAID") return { cls: "success", text: "Success" };
        if (s === "FAILED" || s === "FAILURE") return { cls: "failed", text: "Failed" };
        if (s === "EXPIRED") return { cls: "failed", text: "Expired" };
        if (s === "PENDING_VERIFY") return { cls: "pending", text: "Verifying" };
        return { cls: "pending", text: "Pending" };
      }

      function formatDate(iso) {
        if (!iso) return "—";
        try {
          var d = new Date(iso);
          return d.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        } catch (_) {
          return iso;
        }
      }

      function loadHistory() {
        if (!histList) return;
        histList.innerHTML = '<div class="hist-loading">Loading…</div>';

        var token = sessionStorage.getItem("drago_token");
        var api = getApiUrl();
        if (!token || !api) {
          histList.innerHTML = '<div class="hist-empty">Login required</div>';
          return;
        }

        dragoApiFetch(api + "/payment-history", {
          headers: { Authorization: "Bearer " + token }
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (!data || !data.success) {
              histList.innerHTML = '<div class="hist-empty">Could not load history</div>';
              return;
            }
            var orders = data.orders || [];
            if (!orders.length) {
              histList.innerHTML = '<div class="hist-empty">No payments yet</div>';
              return;
            }

            histList.innerHTML = "";
            orders.forEach(function (o) {
              var badge = statusBadge(o.payment_status);
              var planName = PLAN_LABELS[o.plan] || (o.plan || "Plan");
              var item = document.createElement("div");
              item.className = "hist-item";

              var top = document.createElement("div");
              top.className = "hist-top";
              var h = document.createElement("p");
              h.className = "hist-plan";
              h.textContent = planName;
              var b = document.createElement("span");
              b.className = "hist-badge " + badge.cls;
              b.textContent = badge.text;
              top.appendChild(h);
              top.appendChild(b);

              var meta = document.createElement("div");
              meta.className = "hist-meta";

              var idRow = document.createElement("div");
              idRow.className = "hist-id-row";
              var idLabel = document.createElement("span");
              idLabel.innerHTML = "Payment ID: <strong></strong>";
              var idStrong = idLabel.querySelector("strong");
              var oid = o.order_id ? String(o.order_id) : "—";
              if (idStrong) idStrong.textContent = oid;
              idRow.appendChild(idLabel);
              if (o.order_id) {
                var copyBtn = document.createElement("button");
                copyBtn.type = "button";
                copyBtn.className = "hist-copy-btn";
                copyBtn.title = "Copy Payment ID";
                copyBtn.setAttribute("aria-label", "Copy Payment ID");
                copyBtn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                copyBtn.addEventListener("click", function (ev) {
                  ev.stopPropagation();
                  var text = String(o.order_id);
                  function done() {
                    copyBtn.style.background = "#059669";
                    setTimeout(function () {
                      copyBtn.style.background = "";
                    }, 800);
                  }
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(function () {
                      var ta = document.createElement("textarea");
                      ta.value = text;
                      document.body.appendChild(ta);
                      ta.select();
                      try { document.execCommand("copy"); } catch (_) {}
                      document.body.removeChild(ta);
                      done();
                    });
                  } else {
                    var ta = document.createElement("textarea");
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand("copy"); } catch (_) {}
                    document.body.removeChild(ta);
                    done();
                  }
                });
                idRow.appendChild(copyBtn);
              }
              meta.appendChild(idRow);

              var rest = document.createElement("p");
              rest.style.margin = "0.25rem 0 0";
              rest.innerHTML =
                "Amount: <strong>₹" +
                (o.amount != null ? o.amount : "—") +
                "</strong><br/>" +
                "Time: " +
                formatDate(o.created_at) +
                (o.utr ? "<br/>UTR: " + o.utr : "");
              meta.appendChild(rest);

              item.appendChild(top);
              item.appendChild(meta);

              if (o.can_continue) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "hist-continue";
                btn.textContent = "Continue Payment";
                btn.addEventListener("click", function () {
                  if (o.continue_mode === "manual" || (!o.payment_url && o.plan)) {
                    closeHistory();
                    openCustomPay(
                      o.plan,
                      "Continue payment — scan QR and submit UTR.",
                      o.order_id
                    );
                  } else if (o.payment_url) {
                    showPayLoading();
                    window.location.href = o.payment_url;
                  }
                });
                item.appendChild(btn);
              }

              histList.appendChild(item);
            });
          })
          .catch(function () {
            histList.innerHTML = '<div class="hist-empty">Network error</div>';
          });
      }

      if (historyBtn) historyBtn.addEventListener("click", openHistory);
      if (histClose) histClose.addEventListener("click", closeHistory);
      if (histOverlay) {
        histOverlay.addEventListener("click", function (e) {
          if (e.target === histOverlay) closeHistory();
        });
      }

      /* Return from gateway: ?order=xxx → status check */
      (function checkReturnOrder() {
        var params = new URLSearchParams(window.location.search);
        var orderId = params.get("order");
        if (!orderId) return;

        var token = sessionStorage.getItem("drago_token");
        var api = getApiUrl();
        if (!token || !api) return;

        dragoApiFetch(api + "/order-status?order_id=" + encodeURIComponent(orderId), {
          headers: { Authorization: "Bearer " + token }
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            if (!data || !data.success) return;
            if (data.payment_status === "SUCCESS") {
              alert("Payment successful! Plan: " + (data.plan || "") + " · ₹" + (data.amount || ""));
            } else if (data.payment_status === "FAILED") {
              alert("Payment failed. Please try again.");
            } else {
              alert("Payment pending. Status will update shortly.");
            }
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, "", "../subscription/");
            }
          })
          .catch(function () {});
      })();

      /* Card slider — smooth swipe */
      var track = document.getElementById("cardTrack");
      var slider = document.getElementById("cardSlider");
      var dots = document.querySelectorAll(".slider-dot");
      var current = 0;
      var total = 2;
      var startX = 0;
      var startY = 0;
      var currentX = 0;
      var isDragging = false;
      var isHorizontal = null;
      var threshold = 40;
      var width = 0;

      function getWidth() {
        return slider ? slider.offsetWidth : 1;
      }

      function goTo(index) {
        if (index < 0) index = 0;
        if (index >= total) index = total - 1;
        current = index;
        if (track) {
          track.classList.remove("dragging");
          track.style.transform = "translate3d(-" + (current * 100) + "%,0,0)";
        }
        dots.forEach(function (d, i) {
          if (i === current) d.classList.add("active");
          else d.classList.remove("active");
        });
      }

      function setDragOffset(diffPx) {
        width = getWidth();
        var pct = -current * 100 + (diffPx / width) * 100;
        /* slight rubber-band at edges */
        if ((current === 0 && diffPx > 0) || (current === total - 1 && diffPx < 0)) {
          pct = -current * 100 + (diffPx / width) * 30;
        }
        if (track) track.style.transform = "translate3d(" + pct + "%,0,0)";
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          goTo(parseInt(dot.getAttribute("data-index"), 10));
        });
      });

      if (slider && track) {
        /* Touch */
        slider.addEventListener("touchstart", function (e) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          currentX = startX;
          isDragging = true;
          isHorizontal = null;
          track.classList.add("dragging");
        }, { passive: true });

        slider.addEventListener("touchmove", function (e) {
          if (!isDragging) return;
          var x = e.touches[0].clientX;
          var y = e.touches[0].clientY;
          var dx = x - startX;
          var dy = y - startY;

          if (isHorizontal === null) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            isHorizontal = Math.abs(dx) > Math.abs(dy);
            if (!isHorizontal) {
              isDragging = false;
              track.classList.remove("dragging");
              goTo(current);
              return;
            }
          }
          if (!isHorizontal) return;

          currentX = x;
          setDragOffset(dx);
        }, { passive: true });

        slider.addEventListener("touchend", function () {
          if (!isDragging && isHorizontal !== true) {
            isDragging = false;
            isHorizontal = null;
            return;
          }
          isDragging = false;
          track.classList.remove("dragging");
          var diff = currentX - startX;
          if (diff < -threshold) goTo(current + 1);
          else if (diff > threshold) goTo(current - 1);
          else goTo(current);
          startX = 0;
          currentX = 0;
          isHorizontal = null;
        });

        /* Mouse */
        slider.addEventListener("mousedown", function (e) {
          startX = e.clientX;
          currentX = startX;
          isDragging = true;
          isHorizontal = true;
          track.classList.add("dragging");
          e.preventDefault();
        });

        window.addEventListener("mousemove", function (e) {
          if (!isDragging) return;
          currentX = e.clientX;
          setDragOffset(currentX - startX);
        });

        window.addEventListener("mouseup", function () {
          if (!isDragging) return;
          isDragging = false;
          track.classList.remove("dragging");
          var diff = currentX - startX;
          if (diff < -threshold) goTo(current + 1);
          else if (diff > threshold) goTo(current - 1);
          else goTo(current);
          startX = 0;
          currentX = 0;
          isHorizontal = null;
        });
      }
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


