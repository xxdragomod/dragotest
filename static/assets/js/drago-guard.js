(function (w, d) {
  "use strict";
  if (w.__DRAGO_GUARD__) return;
  w.__DRAGO_GUARD__ = 1;

  var LOCK = "/security-lock/";
  var locked = 0;
  var isLock = (w.location.pathname || "").indexOf("security-lock") !== -1;
  var lastBan = 0;

  function getToken() {
    try {
      if (w.DRAGO_SEC && w.DRAGO_SEC.getToken) return w.DRAGO_SEC.getToken() || "";
    } catch (e) {}
    try {
      return sessionStorage.getItem("drago_token") || localStorage.getItem("drago_token") || "";
    } catch (e) {
      return "";
    }
  }

  function apiBase() {
    try {
      var c = w.__DRAGO_CONFIG__ || {};
      if (c.API_URL && String(c.API_URL).indexOf("YOUR-RENDER") === -1) {
        return String(c.API_URL).replace(/\/$/, "");
      }
    } catch (e) {}
    return "https://dragopredictor.onrender.com";
  }

  function reportBan(reason) {
    if (Date.now() - lastBan < 5000) return;
    lastBan = Date.now();
    var token = getToken();
    var dev = "";
    try { dev = localStorage.getItem("drago_device") || ""; } catch (e) {}
    // Bina login ke bhi device-block ho — token optional hai
    if (!token && !dev) return;
    var url = apiBase() + "/security/devtools-ban";
    var body = JSON.stringify({
      reason: reason || "devtools",
      device: dev,
      ua: (w.navigator && w.navigator.userAgent) || "",
      path: (w.location && w.location.pathname) || "",
      ts: Date.now(),
    });
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    try {
      fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
        keepalive: true,
        credentials: "omit",
      }).catch(function () {});
    } catch (e) {}
  }

  function lock(r) {
    if (locked || isLock) return;
    locked = 1;
    reportBan(r || "devtools");
    try {
      sessionStorage.clear();
    } catch (e) {}
    try {
      localStorage.removeItem("drago_token");
      localStorage.removeItem("drago_token_expiry");
      localStorage.removeItem("drago_user");
    } catch (e) {}
    // TURANT content chhupa do — koi screen na dikhe (Elements me bhi blank)
    try {
      d.documentElement.style.visibility = "hidden";
      d.body.innerHTML = "";
    } catch (e) {}
    // Ultrafast: report (keepalive) fire hone ke turant baad redirect — bina screen
    var redir = w.__DRAGO_BAN_REDIRECT__ || "";
    setTimeout(function () {
      w.location.replace(redir || LOCK + (r ? "?why=" + encodeURIComponent(r) : ""));
    }, 60);
  }

  function desk() {
    try {
      return !(w.matchMedia && w.matchMedia("(pointer:coarse)").matches);
    } catch (e) {
      return true;
    }
  }

  function sizeOpen() {
    if (!desk()) return false;
    var a = Math.abs((w.outerWidth || 0) - (w.innerWidth || 0));
    var b = Math.abs((w.outerHeight || 0) - (w.innerHeight || 0));
    return a > 160 || b > 160;
  }

  // ── Detection (NO debugger statement → "Paused in debugger" kabhi nahi) ──
  // Signals: console-getter (instant), devtools shortcuts (instant),
  // desktop size-diff (3 strikes), mobile viewport-shrink (3 strikes).
  var loadedAt = Date.now();
  var GRACE_MS = 8000;
  var sizeStrikes = 0;
  var shrinkStrikes = 0;
  var conFired = 0;
  var dbgStrikes = 0;
  var baseInnerHeight = 0;

  function skipChecks() {
    return d.hidden || Date.now() - loadedAt < GRACE_MS;
  }

  // Debugger timing — pause ke dauran page HIDDEN rehta hai (visibility trick),
  // taaki "Paused in debugger" me content na dikhe. Normal user ko koi flash
  // nahi dikhta kyunki hide+measure+show ek hi synchronous tick me hota hai.
  function dbgCheck() {
    var el = d.documentElement;
    el.style.visibility = "hidden";
    var t = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    var dt = performance.now() - t;
    el.style.visibility = "";
    return dt;
  }

  function typingFocused() {
    try {
      var el = d.activeElement;
      if (!el) return false;
      var t = (el.tagName || "").toUpperCase();
      return t === "INPUT" || t === "TEXTAREA" || el.isContentEditable;
    } catch (e) {
      return false;
    }
  }

  d.addEventListener(
    "keydown",
    function (e) {
      var k = e.key || e.code || "";
      if (
        k === "F12" ||
        (e.ctrlKey && e.shiftKey && /^[IiJjCc]$/.test(k)) ||
        (e.ctrlKey && /^[UuSs]$/.test(k)) ||
        (e.metaKey && e.altKey && /^[IiJj]$/.test(k))
      ) {
        e.preventDefault();
        e.stopPropagation();
        lock("keys");
      }
    },
    true
  );
  d.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
    },
    true
  );
  d.addEventListener(
    "dragstart",
    function (e) {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    },
    true
  );

  setInterval(function () {
    if (isLock || locked) return;
    if (skipChecks()) { sizeStrikes = 0; return; }
    if (sizeOpen()) sizeStrikes++; else sizeStrikes = 0;
    if (sizeStrikes >= 3) lock("size");
  }, 800);

  // Debugger timing (har page): DevTools band → ~0ms; khula → pause (>400ms)
  // → turant lock. Content pause ke dauran hidden rehta hai.
  setInterval(function () {
    if (isLock || locked) return;
    if (skipChecks()) { dbgStrikes = 0; return; }
    var dt = dbgCheck();
    if (dt > 400) { lock("dbg"); return; }
    if (dt > 250) dbgStrikes++; else dbgStrikes = 0;
    if (dbgStrikes >= 3) lock("dbg");
  }, 1000);

  // Mobile docked DevTools: viewport height achanak ~aadhi reh jati hai,
  // width SAME rehti hai. Rotation / split-screen me width bhi badalti hai →
  // wo layout change hai, baseline reset. Isliye width-change = safe reset.
  var baseInnerWidth = 0;
  setInterval(function () {
    if (isLock || locked) return;
    if (skipChecks() || typingFocused()) { shrinkStrikes = 0; return; }
    var h = w.innerHeight || 0;
    var wd = w.innerWidth || 0;
    if (wd !== baseInnerWidth) { // rotation / split-screen / multi-window
      baseInnerWidth = wd;
      baseInnerHeight = h;
      shrinkStrikes = 0;
      return;
    }
    if (h > baseInnerHeight) baseInnerHeight = h;
    if (baseInnerHeight >= 500 && h < baseInnerHeight * 0.55) shrinkStrikes++;
    else shrinkStrikes = 0;
    if (shrinkStrikes >= 3) lock("dev");
  }, 1000);

  try {
    var img = new Image();
    Object.defineProperty(img, "id", {
      get: function () {
        conFired++; // console khula ho to browser object stringify karta hai
      },
    });
    setInterval(function () {
      if (isLock || locked) return;
      if (skipChecks()) { conFired = 0; return; }
      // Getter fire = console DevTools me render hua → pakka signal → turant lock
      if (conFired > 0) { lock("con"); return; }
      try {
        console.log(img);
        console.clear && console.clear();
      } catch (e) {}
    }, 3000);
  } catch (e) {}
})(window, document);
