/**
 * DRAGO client security — signed requests (no JWT secret here).
 * APP_ID + APP_SECRET come from build-time __DRAGO_CONFIG__ (Vercel env).
 * UI unchanged; this only wraps fetch headers.
 */
(function (global) {
  "use strict";

  var CFG = global.__DRAGO_CONFIG__ || {};
  var APP_ID = CFG.APP_ID || "";
  var APP_SECRET = CFG.APP_SECRET || "";
  var CLIENT_DOMAIN = CFG.CLIENT_DOMAIN || "dragopredictor.vercel.app";

  function sha256Hex(str) {
    // Sync fallback for browsers without crypto.subtle in non-secure ctx
    // Prefer Web Crypto when available (async path used by signedFetch).
    return null;
  }

  function toHex(buf) {
    var u8 = new Uint8Array(buf);
    var s = "";
    for (var i = 0; i < u8.length; i++) {
      s += (u8[i] < 16 ? "0" : "") + u8[i].toString(16);
    }
    return s;
  }

  function hmacSha256Hex(key, msg) {
    return global.crypto.subtle
      .importKey(
        "raw",
        new TextEncoder().encode(key),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
      .then(function (k) {
        return global.crypto.subtle.sign(
          "HMAC",
          k,
          new TextEncoder().encode(msg)
        );
      })
      .then(toHex);
  }

  function sha256HexAsync(str) {
    return global.crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(str || ""))
      .then(toHex);
  }

  function pathOnlyFromUrl(url) {
    try {
      var u = new URL(url, global.location && global.location.origin);
      return u.pathname;
    } catch (_) {
      var q = String(url || "").split("?")[0];
      if (q.indexOf("http") === 0) {
        try {
          return new URL(q).pathname;
        } catch (e) {
          return q;
        }
      }
      return q;
    }
  }

  function randomNonce(len) {
    len = len || 24;
    var arr = new Uint8Array(len);
    global.crypto.getRandomValues(arr);
    return toHex(arr);
  }

  /**
   * Build signed headers for a request.
   * mode: "auth" | "payment" | "public-app"
   * opts: { method, url, body, userId, userName, mode }
   */
  function buildSignedHeaders(opts) {
    opts = opts || {};
    var method = String(opts.method || "GET").toUpperCase();
    var url = opts.url || "";
    var pathOnly = pathOnlyFromUrl(url);
    var ts = String(Date.now());
    var mode = opts.mode || "auth";
    var nonce = mode === "payment" ? randomNonce(16) : "";
    var userId = mode === "auth" || mode === "payment" ? String(opts.userId || "") : "";
    var userName = mode === "auth" || mode === "payment" ? String(opts.userName || "") : "";
    var bodyStr = "";
    if (method !== "GET" && method !== "HEAD" && opts.body != null) {
      bodyStr =
        typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    }

    if (!APP_ID || !APP_SECRET || !global.crypto || !global.crypto.subtle) {
      return Promise.resolve({
        "X-App-Id": APP_ID || "",
        "X-Client-Domain": CLIENT_DOMAIN,
        "X-Timestamp": ts,
      });
    }

    return sha256HexAsync(bodyStr).then(function (bodyHash) {
      var payload = [
        method,
        pathOnly,
        ts,
        nonce,
        bodyHash,
        userId,
        userName,
        APP_ID,
      ].join("\n");
      return hmacSha256Hex(APP_SECRET, payload).then(function (sig) {
        var h = {
          "X-App-Id": APP_ID,
          "X-Client-Domain": CLIENT_DOMAIN,
          "X-Timestamp": ts,
          "X-Signature": sig,
        };
        if (nonce) h["X-Nonce"] = nonce;
        if (userId) h["X-User-Id"] = userId;
        if (userName) h["X-User-Name"] = userName;
        return h;
      });
    });
  }

  /** sessionStorage only — no long-lived localStorage token */
  var SS = {
    get: function (k) {
      try {
        return sessionStorage.getItem(k);
      } catch (_) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        sessionStorage.setItem(k, v);
      } catch (_) {}
    },
    del: function (k) {
      try {
        sessionStorage.removeItem(k);
      } catch (_) {}
    },
    clearSession: function () {
      ["drago_token", "drago_token_expiry", "drago_user"].forEach(function (k) {
        try {
          sessionStorage.removeItem(k);
          localStorage.removeItem(k);
        } catch (_) {}
      });
    },
  };

  // 1-din session: localStorage → sessionStorage restore (browser band karke
  // kholne par login na dobara lage). Expiry respect karo; valid token retain karo.
  try {
    var le = localStorage.getItem("drago_token_expiry");
    var lt = localStorage.getItem("drago_token");
    if (lt && le && Number(le) < Date.now()) {
      // Expired → dono storage saaf
      localStorage.removeItem("drago_token");
      localStorage.removeItem("drago_token_expiry");
      localStorage.removeItem("drago_user");
      sessionStorage.removeItem("drago_token");
      sessionStorage.removeItem("drago_token_expiry");
      sessionStorage.removeItem("drago_user");
    } else if (lt && !sessionStorage.getItem("drago_token")) {
      sessionStorage.setItem("drago_token", lt);
      if (le) sessionStorage.setItem("drago_token_expiry", le);
      var lu = localStorage.getItem("drago_user");
      if (lu) sessionStorage.setItem("drago_user", lu);
    }
  } catch (_) {}

  function getToken() {
    return SS.get("drago_token") || "";
  }

  function getUser() {
    try {
      return JSON.parse(SS.get("drago_user") || "null");
    } catch (_) {
      return null;
    }
  }

  /**
   * signedFetch(url, { method, body, mode, headers, ... })
   * Auto-adds Authorization + signature headers.
   */
  function signedFetch(url, init) {
    init = init || {};
    var method = (init.method || "GET").toUpperCase();
    var mode = init.mode || "auth";
    var user = getUser() || {};
    var body = init.body;
    var parsedBody = body;
    if (typeof body === "string") {
      try {
        parsedBody = JSON.parse(body);
      } catch (_) {
        parsedBody = body;
      }
    }

    function plainFetch() {
      var headers = Object.assign({}, init.headers || {});
      var token = getToken();
      if (token) headers["Authorization"] = "Bearer " + token;
      if (body != null && !headers["Content-Type"] && method !== "GET") {
        headers["Content-Type"] = "application/json";
      }
      var next = Object.assign({}, init, { headers: headers });
      delete next.mode;
      return fetch(url, next);
    }

    return buildSignedHeaders({
      method: method,
      url: url,
      body: parsedBody,
      userId: user.id || "",
      userName: user.name || "",
      mode: mode,
    })
      .then(function (sigHeaders) {
        var headers = Object.assign({}, init.headers || {}, sigHeaders);
        var token = getToken();
        if (token) headers["Authorization"] = "Bearer " + token;
        if (body != null && !headers["Content-Type"] && method !== "GET") {
          headers["Content-Type"] = "application/json";
        }
        var next = Object.assign({}, init, { headers: headers });
        delete next.mode;
        return fetch(url, next);
      })
      .catch(function () {
        return plainFetch();
      });
  }

  global.DRAGO_SEC = {
    buildSignedHeaders: buildSignedHeaders,
    signedFetch: signedFetch,
    getToken: getToken,
    getUser: getUser,
    SS: SS,
    clearSession: SS.clearSession,
  };
})(typeof window !== "undefined" ? window : globalThis);
