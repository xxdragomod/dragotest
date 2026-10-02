/* DRAGO Login — server-side Google OAuth (Client ID frontend mein NAHI hai) */

// Sirf API URL build time pe inject hota hai — koi Google ID nahi
const CONFIG = window.__DRAGO_CONFIG__ || {};
const RAW_API_URL = CONFIG.API_URL || "";

/* 🔒 Security Layer 5: HTTPS-only API URL — http:// ko block */
function isValidApiUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch (_) { return false; }
}
const API_URL = isValidApiUrl(RAW_API_URL) ? RAW_API_URL : "";

const btn = document.getElementById("googleBtn");
const errorBox = document.getElementById("errorBox");

/* ===== Typing animation ===== */
const phrases = [
  "Understand The Logic",
  "Predict With Confidence",
  "Smart Signals Only",
  "Play The Pattern",
  "Stay Ahead Every Draw",
  "Logic Over Luck"
];
const typeEl = document.getElementById("typeText");
let p = 0, i = 0, deleting = false;

function tick() {
  const text = phrases[p];
  if (!deleting) {
    typeEl.textContent = text.slice(0, i);
    i++;
    if (i > text.length) {
      deleting = true;
      setTimeout(tick, 3200);
      return;
    }
    setTimeout(tick, 90);
  } else {
    typeEl.textContent = text.slice(0, i);
    i--;
    if (i < 0) {
      deleting = false;
      p = (p + 1) % phrases.length;
      i = 0;
      setTimeout(tick, 500);
      return;
    }
    setTimeout(tick, 50);
  }
}
tick();

/* ===== Helpers ===== */
function showError(msg) {
  // textContent use karo — XSS prevention
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function setLoading(on) {
  if (on) {
    btn.disabled = true;
    btn.dataset.label = btn.textContent;
    // Safe innerHTML — no user data inside
    btn.innerHTML =
      '<span class="spinner"></span><span style="margin-left:10px">Signing in...</span>';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || "Get Started";
  }
}

/* ===== Sanitize helper — user input safe banata hai ===== */
function sanitize(str) {
  if (typeof str !== "string") return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.textContent;
}

/* ===== Validate token format — basic JWT shape check ===== */
function isValidToken(token) {
  if (!token || typeof token !== "string") return false;
  // JWT: header.payload.signature — min 3 parts, each non-empty
  const parts = token.split(".");
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/* ===== OAuth callback token uthao (#token=...) ===== */
(function handleOAuthReturn() {
  if (location.hash.startsWith("#token=")) {
    const rawToken = decodeURIComponent(location.hash.slice(7));

    // 🔒 Security: Token validate karo — invalid token store mat karo
    if (!isValidToken(rawToken)) {
      console.warn("[DRAGO] Invalid token format rejected.");
      history.replaceState(null, "", location.pathname + "?error=invalid_token");
      return;
    }

    // Token sirf tabhi store karo jab valid ho
    sessionStorage.setItem("drago_token", rawToken);

    // Hash clear karo — URL se token hatao (replay attack prevent)
    history.replaceState(null, "", location.pathname);

    // Token sirf 24hrs ke liye hi localStorage mein rakho (session expiry)
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    sessionStorage.setItem("drago_token_expiry", String(expiry));

    // 1-din persistence: browser band karke kholne par dobara login na lage
    try {
      localStorage.setItem("drago_token", rawToken);
      localStorage.setItem("drago_token_expiry", String(expiry));
    } catch (e) {}

    if (window.DRAGO_SEC && DRAGO_SEC.SS) {
      DRAGO_SEC.SS.set("drago_token", rawToken);
      DRAGO_SEC.SS.set("drago_token_expiry", String(Date.now() + 24 * 60 * 60 * 1000));
    }
    window.location.replace("dashboard/");
  }

  // Backend se error wapas aaya ho
  const params = new URLSearchParams(location.search);
  if (params.get("error")) {
    const errMsg = params.get("error_description") || "Google sign-in fail hua.";
    showError(sanitize(errMsg));
    history.replaceState(null, "", location.pathname);
  }
})();

// Pehle se logged in? → session check karo
(function checkExistingSession() {
  const token = sessionStorage.getItem("drago_token");
  const expiry = sessionStorage.getItem("drago_token_expiry");

  // 🔒 Security: Token expiry check
  if (token && expiry && Number(expiry) < Date.now()) {
    sessionStorage.removeItem("drago_token");
    sessionStorage.removeItem("drago_token_expiry");
    sessionStorage.removeItem("drago_user");
    return;
  }

  if (token && API_URL) {
    var verifyInit = { headers: { Authorization: "Bearer " + token }, mode: "auth" };
    var doFetch =
      window.DRAGO_SEC && DRAGO_SEC.signedFetch
        ? DRAGO_SEC.signedFetch(API_URL + "/verify", verifyInit)
        : fetch(API_URL + "/verify", verifyInit);
    doFetch
      .then(function (r) {
        if (r.ok) {
          window.location.replace("dashboard/");
        } else {
          sessionStorage.removeItem("drago_token");
          sessionStorage.removeItem("drago_token_expiry");
          sessionStorage.removeItem("drago_user");
        }
      })
      .catch(function () {
        /* network error — keep token */
      });
  }
})();

/* ===== Button click → backend OAuth redirect ===== */
btn.addEventListener("click", () => {
  errorBox.style.display = "none";
  setLoading(true);

  if (!API_URL) {
    showError("Server config missing. Baad mein try karo.");
    setLoading(false);
    return;
  }

  // 🔒 Security: API_URL validate karo — bas HTTPS allowed
  try {
    const urlObj = new URL(API_URL);
    if (urlObj.protocol !== "https:") {
      showError("Secure connection required. Try again.");
      setLoading(false);
      return;
    }
  } catch (_) {
    showError("Invalid server configuration.");
    setLoading(false);
    return;
  }

  // Google callback ko isi frontend origin par wapas bhejne ke liye return_to pass karo.
  // Production dragopredictor ko wahi origin milega; dragotest apne test domain par rahega.
  try {
    const oauthUrl = new URL("/auth/google", API_URL);
    oauthUrl.searchParams.set("return_to", window.location.origin);

    // Referral code present ho to OAuth flow ke across preserve karo.
    const referralCode = new URLSearchParams(window.location.search).get("ref");
    if (referralCode) oauthUrl.searchParams.set("ref", referralCode);

    window.location.assign(oauthUrl.toString());
  } catch (_) {
    showError("Invalid server configuration.");
    setLoading(false);
  }
});
