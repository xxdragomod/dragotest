/* DRAGO Prediction Page — live data + IST-synced fetch */

(function initSession() {
  const token = sessionStorage.getItem("drago_token");
  const expiry = sessionStorage.getItem("drago_token_expiry");
  if (!token || (expiry && Number(expiry) < Date.now())) {
    sessionStorage.removeItem("drago_token");
    sessionStorage.removeItem("drago_token_expiry");
    sessionStorage.removeItem("drago_user");
    window.location.replace("../");
    return;
  }
})();

function isValidApiUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch (_) {
    return false;
  }
}

const RAW_API_URL = (window.__DRAGO_CONFIG__ || {}).API_URL;
const API_URL = isValidApiUrl(RAW_API_URL) ? RAW_API_URL : "";
const FETCH_TIMEOUT_MS = 8000;
function dragoFetch(url, init) {
  init = init || {};
  init.mode = init.mode || "auth";
  if (window.DRAGO_SEC && DRAGO_SEC.signedFetch) return DRAGO_SEC.signedFetch(url, init);
  return fetch(url, init);
}


/* ─── Drawer ─── */
const menuBtn = document.getElementById("menuBtn");
const sideDrawer = document.getElementById("sideDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");

function openPredDrawer() {
  sideDrawer && sideDrawer.classList.add("open");
  drawerOverlay && drawerOverlay.classList.add("show");
  sideDrawer && sideDrawer.setAttribute("aria-hidden", "false");
  menuBtn && menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-open");
}

function closePredDrawer() {
  sideDrawer && sideDrawer.classList.remove("open");
  drawerOverlay && drawerOverlay.classList.remove("show");
  sideDrawer && sideDrawer.setAttribute("aria-hidden", "true");
  menuBtn && menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
}

if (menuBtn) menuBtn.addEventListener("click", openPredDrawer);
if (drawerClose) drawerClose.addEventListener("click", closePredDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", closePredDrawer);

/* ─── Views ─── */
const skeletonView = document.getElementById("skeletonView");
const contentDiv = document.getElementById("predictionContent");
const errorDiv = document.getElementById("errorView");

function setView(name) {
  if (skeletonView) {
    skeletonView.classList.toggle("is-on", name === "skeleton");
    skeletonView.hidden = name !== "skeleton";
  }
  if (contentDiv) {
    contentDiv.classList.toggle("is-on", name === "content");
    contentDiv.hidden = name !== "content";
  }
  if (errorDiv) {
    errorDiv.classList.toggle("is-on", name === "error");
    errorDiv.hidden = name !== "error";
  }
}

function showError(msg) {
  setView("error");
  const p = errorDiv && errorDiv.querySelector(".pred-error-box p");
  if (p) p.textContent = msg;
}

function esc(str) {
  if (typeof str !== "string") return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.textContent;
}

/* ─── IST timer ─── */
let istTimerInterval = null;
let prevRemaining = null;
let fetchInFlight = false;
let lastFetchAt = 0;

function getISTDate() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600000);
}

function getSecToNextBoundary() {
  const ist = getISTDate();
  const totalMs = ist.getSeconds() * 1000 + ist.getMilliseconds();
  if (totalMs < 30000) return Math.max(0, Math.ceil((30000 - totalMs) / 1000));
  return Math.max(0, Math.ceil((60000 - totalMs) / 1000));
}

function startISTTimer() {
  clearInterval(istTimerInterval);
  prevRemaining = null;
  updateISTTimerUI();
  istTimerInterval = setInterval(updateISTTimerUI, 250);
}

function updateISTTimerUI() {
  const remaining = getSecToNextBoundary();
  const el = document.getElementById("predTimerTop");
  if (el) {
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    el.textContent = mm + " : " + ss;
    if (remaining <= 5) el.classList.add("urgent");
    else el.classList.remove("urgent");
  }

  // Timer almost done → pre-fetch so chart is ready at boundary
  if (prevRemaining !== null && prevRemaining > 0 && remaining === 0) {
    fetchLiveHistory(true);
  }

  if (prevRemaining !== null && remaining > prevRemaining) {
    // New 30s period — update chart immediately (no 1.2s lag)
    if (!userIsPro) {
      predictionUnlocked = false;
      updateFreeOverlay();
    }
    // Instant chart refresh + short burst (lottery API may publish slightly late)
    fetchLiveHistory(true);
    [250, 600, 1200, 2200, 3500].forEach(function (ms) {
      setTimeout(function () {
        fetchLiveHistory(true);
      }, ms);
    });
    if (API_URL && userIsPro) {
      fetchPrediction(API_URL, false, false);
      setTimeout(function () {
        fetchPrediction(API_URL, false, false);
      }, 900);
    }
  }
  prevRemaining = remaining;
}

function stopISTTimer() {
  clearInterval(istTimerInterval);
  istTimerInterval = null;
}


/* ─── Gauges ─── */
const GAUGE_CIRC = 88; // 2 * Math.PI * 14

function setGauge(fillId, valId, percent, displayText) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const fill = document.getElementById(fillId);
  const valEl = document.getElementById(valId);
  if (fill) {
    const filled = (pct / 100) * GAUGE_CIRC;
    fill.setAttribute("stroke-dasharray", filled.toFixed(1) + " " + GAUGE_CIRC);
  }
  if (valEl) {
    valEl.textContent =
      displayText != null && displayText !== ""
        ? String(displayText)
        : String(Math.round(pct));
  }
}

function updateGauges(pred) {
  // Engine level = loss ladder L1..L7 (integer). NEVER treat as 0-1 percent.
  // Bug was: level 1 → *100 → shows 100
  const MAX_LEVEL = 7;
  let levelRaw = pred.level ?? pred.lvl ?? pred.signal_level;
  let level = Number(levelRaw);
  if (!Number.isFinite(level) || level < 1) {
    // badge like "L2"
    const badge = String(pred.badge || "").toUpperCase();
    const m = badge.match(/L(\d+)/);
    level = m ? parseInt(m[1], 10) : 1;
  }
  level = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  const levelGaugePct = Math.max(12, Math.min(100, (level / MAX_LEVEL) * 100));

  let conf = pred.confidence ?? pred.conf ?? pred.score ?? pred.probability;
  conf = Number(conf);
  if (!Number.isFinite(conf) || conf < 0) conf = 0;
  if (conf > 0 && conf <= 1) conf = conf * 100; // only true 0-1 ratios
  conf = Math.max(0, Math.min(100, conf));

  setGauge("gaugeLevelFill", "gaugeLevelVal", levelGaugePct, String(level));
  setGauge("gaugeConfFill", "gaugeConfVal", conf);

  // Power always 100%
  const powerBar = document.getElementById("gaugePowerBar");
  const powerVal = document.getElementById("gaugePowerVal");
  if (powerBar) powerBar.style.width = "100%";
  if (powerVal) powerVal.textContent = "100%";
}


/* ─── Render ─── */
function pickPredictionObject(json) {
  if (!json || typeof json !== "object") return null;
  if (json.prediction && typeof json.prediction === "object") return json.prediction;
  if (json.data && json.data.prediction && typeof json.data.prediction === "object") {
    return json.data.prediction;
  }
  if (json.result && typeof json.result === "object") return json.result;
  if (typeof json.prediction === "string") return json;
  return json;
}

function renderPrediction(json) {
  const pred = pickPredictionObject(json) || {};
  const rawPred = pred.prediction || pred.signal || pred.result || pred.value || "";
  const predUpper = String(rawPred).toUpperCase();
  const isWait = predUpper === "WAIT";
  const isSkip = predUpper === "SKIP";
  const isBig = predUpper === "BIG";

  const resultEl = document.getElementById("predResultValue");
  if (resultEl) {
    if (isWait) {
      resultEl.textContent = "WARM-UP";
      resultEl.className = "pred-result-plain";
    } else if (isSkip) {
      resultEl.textContent = "SKIP";
      resultEl.className = "pred-result-plain";
    } else {
      resultEl.textContent = rawPred || "—";
      resultEl.className = "pred-result-plain" + (isBig ? " big" : " small");
    }
  }

  // Engine abhi bootstrap ho raha hai (data source se history aana baaki hai)
  const hintEl = document.getElementById("predHintText");
  if (hintEl) {
    if (isWait) {
      hintEl.textContent = "Engine warm-up me hai — data source se history load ho rahi hai (1-2 min).";
    } else if (json && json.stale) {
      hintEl.textContent = "Last known prediction (source offline tha — stale data).";
    } else {
      hintEl.textContent = "";
    }
  }

  const periodText = pred.period != null && pred.period !== ""
    ? String(pred.period)
    : "—";

  const periodTopEl = document.getElementById("predPeriodTop");
  if (periodTopEl) periodTopEl.textContent = periodText;

  updateGauges(pred);

  setView("content");
}

/* ─── Plan / free quota ─── */
let userIsPro = false;
let freePredRemaining = 3;
let freePredUsed = 0;
let predictionUnlocked = false; // free user has revealed current slot

function authHeaders() {
  const t = sessionStorage.getItem("drago_token") || "";
  return { Authorization: "Bearer " + t };
}

function updateFreeOverlay() {
  const overlay = document.getElementById("freePredOverlay");
  const btn = document.getElementById("getPredBtn");
  const hint = document.getElementById("freePredHint");
  const upgrade = document.getElementById("upgradePredLink");
  if (!overlay) return;

  if (userIsPro) {
    overlay.hidden = true;
    overlay.style.display = "none";
    predictionUnlocked = true;
    return;
  }

  // Free user
  if (predictionUnlocked && freePredRemaining > 0) {
    overlay.hidden = true;
    overlay.style.display = "none";
    return;
  }

  overlay.hidden = false;
  overlay.style.display = "flex";

  if (freePredRemaining <= 0) {
    if (btn) btn.style.display = "none";
    if (hint) {
      hint.textContent = "Free limit reached (3/3). Upgrade to Pro for unlimited.";
    }
    if (upgrade) upgrade.hidden = false;
  } else {
    if (btn) btn.style.display = "";
    if (hint) {
      hint.textContent =
        freePredRemaining + " free prediction" + (freePredRemaining === 1 ? "" : "s") + " remaining";
    }
    if (upgrade) upgrade.hidden = true;
  }
}

async function loadPredictionQuota() {
  if (!API_URL) return;
  try {
    const r = await dragoFetch(API_URL + "/prediction-quota", {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return;
    const data = await r.json();
    if (!data || !data.success) return;
    userIsPro = !!data.is_pro;
    freePredUsed = Number(data.free_pred_used) || 0;
    freePredRemaining =
      data.free_pred_remaining != null
        ? Number(data.free_pred_remaining)
        : Math.max(0, 3 - freePredUsed);
    if (userIsPro) predictionUnlocked = true;
    updateFreeOverlay();
  } catch (_) {}
}

/* ─── Fetch ─── */
async function fetchPrediction(apiUrl, isInitial, consume) {
  if (!apiUrl) return;
  if (fetchInFlight) return;
  if (!isInitial && !consume && Date.now() - lastFetchAt < 2000) return;

  // Free users only fetch when they explicitly consume (button) or already unlocked + pro auto-refresh
  if (!userIsPro && !consume && !predictionUnlocked) {
    setView("content");
    updateFreeOverlay();
    return;
  }

  fetchInFlight = true;
  lastFetchAt = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

  try {
    const base = String(apiUrl).replace(/\/+$/, "");
    const q = consume && !userIsPro ? "?consume=1" : "";
    const r = await dragoFetch(base + "/wingo30s_prediction" + q, {
      signal: controller.signal,
      cache: "no-store",
      headers: authHeaders(),
    });
    const json = await r.json().catch(function () { return null; });

    if (r.status === 402 || (json && json.billing_required)) {
      freePredRemaining = 0;
      predictionUnlocked = false;
      updateFreeOverlay();
      setView("content");
      return;
    }

    if (!r.ok) {
      if (r.status === 502 || r.status === 503) {
        showError("Prediction server offline (orihost). Retrying…");
      }
      throw new Error("http " + r.status);
    }

    if (json) {
      if (json.is_pro != null) userIsPro = !!json.is_pro;
      if (json.plan === "pro") userIsPro = true;
      if (json.free_pred_remaining != null) {
        freePredRemaining = Number(json.free_pred_remaining);
      }
      if (json.free_pred_used != null) {
        freePredUsed = Number(json.free_pred_used);
      }
      if (consume || userIsPro) predictionUnlocked = true;
      renderPrediction(json);
      updateFreeOverlay();
    }
  } catch (e) {
    console.warn("[DRAGO] API failed:", e && e.message);
    if (isInitial) {
      showError("Prediction source offline. Retrying…");
    }
  } finally {
    clearTimeout(timer);
    fetchInFlight = false;
  }
}

// Wire Get Prediction button + back
(function wirePredUi() {
  const btn = document.getElementById("getPredBtn");
  if (btn) {
    btn.addEventListener("click", function () {
      if (!API_URL || freePredRemaining <= 0) return;
      btn.disabled = true;
      btn.textContent = "Loading…";
      fetchPrediction(API_URL, false, true).finally(function () {
        btn.disabled = false;
        btn.textContent = "GET PREDICTION";
      });
    });
  }
const upgrade = document.getElementById("upgradePredLink");
  if (upgrade) {
    upgrade.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "../subscription/";
    });
  }
})();



/* ─── Live Market Chart ─── */
const HISTORY_API =
  "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const CHART_POINTS = 30;
let chartPoints = [];
let historyFetchInFlight = false;
let lastHistoryFetch = 0;

function parseHistoryPayload(json) {
  let list = [];
  if (!json) return list;
  if (Array.isArray(json)) list = json;
  else if (Array.isArray(json.items)) list = json.items; // Render /market proxy shape
  else if (Array.isArray(json.data)) list = json.data;
  else if (json.data && Array.isArray(json.data.list)) list = json.data.list;
  else if (json.data && Array.isArray(json.data.records)) list = json.data.records;
  else if (Array.isArray(json.list)) list = json.list;
  else if (json.data && typeof json.data === "object" && !Array.isArray(json.data)) {
    // object map keyed by issueNumber
    list = Object.keys(json.data).map(function (k) { return json.data[k]; });
  } else if (typeof json === "object") {
    // top-level map of issue -> row (like local history dump)
    var keys = Object.keys(json);
    if (keys.length && json[keys[0]] && (json[keys[0]].number != null || json[keys[0]].issueNumber)) {
      list = keys.map(function (k) { return json[k]; });
    }
  }

  var rows = list.map(function (row) {
    if (!row || typeof row !== "object") return null;
    var num = row.number != null ? row.number : row.premium;
    var n = parseInt(String(num), 10);
    if (isNaN(n)) return null;
    var issue = row.issueNumber || row.issue || row.period || "";
    var color = String(row.color || "");
    return {
      number: n,
      issue: String(issue),
      color: color,
      isBig: n >= 5,
      isViolet: color.indexOf("violet") !== -1
    };
  }).filter(Boolean);

  // sort by issue ascending (oldest first for chart left→right)
  rows.sort(function (a, b) {
    if (a.issue < b.issue) return -1;
    if (a.issue > b.issue) return 1;
    return 0;
  });

  if (rows.length > CHART_POINTS) rows = rows.slice(rows.length - CHART_POINTS);
  return rows;
}

function renderChartBalls(points) {
  var el = document.getElementById("chartBalls");
  if (!el) return;
  var recent = points.slice(-10);
  el.innerHTML = recent.map(function (p) {
    var n = Math.max(0, Math.min(9, p.number | 0));
    var cls = "pred-ball" + (p.isViolet ? " violet" : "");
    return (
      '<span class="' + cls + '">' +
        '<img class="pred-ball-img" src="../assets/images/number' + n + '.png" alt="' + n + '" ' +
        'onerror="this.style.display=\'none\';this.parentNode.textContent=\'' + n + '\';" />' +
      "</span>"
    );
  }).join("");
}

function drawLiveChart(points) {
  var canvas = document.getElementById("predChartCanvas");
  if (!canvas) return;
  var parent = canvas.parentElement;
  var dpr = window.devicePixelRatio || 1;
  var cssW = parent ? parent.clientWidth : 360;
  var cssH = parseInt(getComputedStyle(canvas).height, 10) || 160;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  var ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (!points || points.length < 1) {
    ctx.fillStyle = "#9a886c";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Waiting for market data…", cssW / 2, cssH / 2);
    return;
  }

  var padL = 8, padR = 8, padT = 18, padB = 24;
  var w = cssW - padL - padR;
  var h = cssH - padT - padB;
  var n = points.length;
  var gap = Math.max(2, Math.min(6, w / n * 0.18));
  var barW = Math.max(4, (w - gap * (n - 1)) / n);
  var maxY = 9;

  // soft baseline
  ctx.strokeStyle = "rgba(232, 220, 200, 0.95)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT + h);
  ctx.lineTo(cssW - padR, padT + h);
  ctx.stroke();

  // mid guide (4.5 ≈ big/small split visual)
  var midY = padT + h - (4.5 / maxY) * h;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(201, 162, 39, 0.28)";
  ctx.beginPath();
  ctx.moveTo(padL, midY);
  ctx.lineTo(cssW - padR, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  for (var i = 0; i < n; i++) {
    var p = points[i];
    var val = Math.max(0, Math.min(9, p.number));
    var bh = Math.max(6, (val / maxY) * h);
    var x = padL + i * (barW + gap);
    var y = padT + h - bh;
    var isLast = i === n - 1;

    // bar gradient
    var g = ctx.createLinearGradient(x, y, x, padT + h);
    if (p.isBig) {
      g.addColorStop(0, isLast ? "#e8c96a" : "#d4b24a");
      g.addColorStop(1, isLast ? "#9a7a16" : "#b8952e");
    } else {
      g.addColorStop(0, isLast ? "#a09078" : "#8a7860");
      g.addColorStop(1, isLast ? "#5a4a38" : "#6b5a48");
    }

    // rounded bar
    var r = Math.min(5, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + barW, y, x + barW, y + bh, r);
    ctx.arcTo(x + barW, y + bh, x, y + bh, 0);
    ctx.arcTo(x, y + bh, x, y, 0);
    ctx.arcTo(x, y, x + barW, y, r);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    if (isLast) {
      ctx.shadowColor = "rgba(201, 162, 39, 0.45)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      // ring
      ctx.strokeStyle = "rgba(201, 162, 39, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 1.5, y - 1.5, barW + 3, bh + 3);
    }

    // number on top of bar
    ctx.fillStyle = isLast ? "#241c12" : "#6b5a48";
    ctx.font = (isLast ? "800 " : "700 ") + Math.max(9, Math.min(11, barW * 0.85)) + "px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(val), x + barW / 2, y - 5);
  }
}

var lastChartIssue = "";
var chartAnimFrom = null;
var chartAnimRaf = null;

function chartSignature(points) {
  if (!points || !points.length) return "";
  var last = points[points.length - 1];
  return String(last.issue || "") + ":" + String(last.number);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function drawLiveChartAnimated(fromPts, toPts, durationMs) {
  if (chartAnimRaf) cancelAnimationFrame(chartAnimRaf);
  var start = performance.now();
  var dur = durationMs || 480;
  function frame(now) {
    var t = Math.min(1, (now - start) / dur);
    var e = easeOutCubic(t);
    var blended = (toPts || []).map(function (p, i) {
      var prev = (fromPts && fromPts[i]) || p;
      var fromN = Number(prev.number);
      var toN = Number(p.number);
      if (!isFinite(fromN)) fromN = toN;
      return {
        number: fromN + (toN - fromN) * e,
        issue: p.issue,
        color: p.color,
        isBig: p.isBig,
        isViolet: p.isViolet,
      };
    });
    // if lengths differ (new bar), pad from with zeros at end
    if (fromPts && toPts && toPts.length > fromPts.length) {
      blended = toPts.map(function (p, i) {
        var prev = fromPts[i];
        var fromN = prev ? Number(prev.number) : 0;
        var toN = Number(p.number);
        return {
          number: fromN + (toN - fromN) * e,
          issue: p.issue,
          color: p.color,
          isBig: p.isBig,
          isViolet: p.isViolet,
        };
      });
    }
    drawLiveChart(blended);
    if (t < 1) chartAnimRaf = requestAnimationFrame(frame);
    else {
      chartAnimRaf = null;
      drawLiveChart(toPts);
    }
  }
  chartAnimRaf = requestAnimationFrame(frame);
}

function updateChartUI(points, animate) {
  var next = points || [];
  var sig = chartSignature(next);
  var changed = sig && sig !== lastChartIssue;

  if (animate && changed && chartPoints.length) {
    var wrap = document.querySelector(".pred-chart-canvas-wrap");
    if (wrap) {
      wrap.classList.remove("chart-updating");
      void wrap.offsetWidth;
      wrap.classList.add("chart-updating");
    }
    drawLiveChartAnimated(chartPoints.slice(), next, 520);
  } else {
    drawLiveChart(next);
  }

  chartPoints = next;
  if (sig) lastChartIssue = sig;
  renderChartBalls(chartPoints);
  var meta = document.getElementById("chartMeta");
  if (meta) {
    if (chartPoints.length) {
      var last = chartPoints[chartPoints.length - 1];
      meta.textContent = "Last: " + last.number + (last.isBig ? " BIG" : " SMALL");
    } else {
      meta.textContent = "—";
    }
  }
}

async function fetchLiveHistory(force) {
  if (historyFetchInFlight) return;
  // 2s poll — allow frequent checks; force bypasses min gap
  if (!force && Date.now() - lastHistoryFetch < 1200) return;
  historyFetchInFlight = true;
  lastHistoryFetch = Date.now();

  // 1) Pehle RENDER proxy (no JWT, server se VPS history) — CORS/Cloudflare safe
  if (API_URL) {
    try {
      var controller = new AbortController();
      var t = setTimeout(function () { controller.abort(); }, 8000);
      var r = await dragoFetch(
        String(API_URL).replace(/\/+$/, "") +
          "/market/wingo30s/history?limit=" + CHART_POINTS,
        {
          signal: controller.signal,
          cache: "no-store",
          mode: "public-app",
          headers: { Accept: "application/json" }
        }
      );
      clearTimeout(t);
      if (r && r.ok) {
        var json = await r.json();
        var points = parseHistoryPayload(json);
        if (points.length) {
          updateChartUI(points, true);
          historyFetchInFlight = false;
          return;
        }
      }
    } catch (e) {
      console.warn("[DRAGO] market proxy fetch failed:", e && e.message);
    }
  }

  // 2) Fallback: browser se direct lottery API (kaafi IPs/CORS pe fail hota hai)
  var urls = [
    HISTORY_API + "?pageSize=" + CHART_POINTS + "&pageNo=1",
    HISTORY_API + "?limit=" + CHART_POINTS,
    HISTORY_API
  ];

  var ok = false;
  for (var u = 0; u < urls.length; u++) {
    try {
      var controller2 = new AbortController();
      var t2 = setTimeout(function () { controller2.abort(); }, 8000);
      var r2 = await fetch(urls[u], {
        signal: controller2.signal,
        cache: "no-store",
        mode: "cors",
        headers: { Accept: "application/json" }
      });
      clearTimeout(t2);
      if (!r2.ok) continue;
      var json2 = await r2.json();
      var points2 = parseHistoryPayload(json2);
      if (points2.length) {
        updateChartUI(points2, true);
        ok = true;
        break;
      }
    } catch (e) {
      console.warn("[DRAGO] history fetch failed:", e && e.message);
    }
  }

  if (!ok) {
    var meta = document.getElementById("chartMeta");
    if (meta && !chartPoints.length) meta.textContent = "Market offline";
  }

  historyFetchInFlight = false;
}

window.addEventListener("resize", function () {
  if (chartPoints.length) drawLiveChart(chartPoints);
});


function startPredictionLoop(apiUrl) {
  setView("skeleton");
  loadPredictionQuota().then(function () {
    if (userIsPro) {
      fetchPrediction(apiUrl, true, false);
    } else {
      setView("content");
      updateFreeOverlay();
    }
  });
  fetchLiveHistory(true);
  startISTTimer();
  // Poll every 2s for new pattern; :00 / :30 still force via timer
  setInterval(function () { fetchLiveHistory(false); }, 1500);

  setTimeout(function () {
    if (skeletonView && !skeletonView.hidden) {
      setView("content");
      updateFreeOverlay();
    }
  }, 6000);
}

const retryBtn = document.getElementById("errorRetryBtn");
if (retryBtn) {
  retryBtn.addEventListener("click", function () {
    if (!API_URL) return;
    setView("skeleton");
    if (userIsPro || predictionUnlocked) {
      fetchPrediction(API_URL, true, false);
    } else {
      setView("content");
      updateFreeOverlay();
    }
  });
}

window.addEventListener("beforeunload", function () {
  stopISTTimer();
});

if (!API_URL) {
  showError("Server config missing. API URL is not set.");
} else {
  startPredictionLoop(API_URL);
}
