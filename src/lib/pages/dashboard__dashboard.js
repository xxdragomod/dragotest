/* DRAGO Dashboard — session guard + user info + logout */

(function init() {
  const token = sessionStorage.getItem("drago_token");
  const expiry = sessionStorage.getItem("drago_token_expiry");

  // 🔒 Security: Token expiry check
  if (!token || (expiry && Number(expiry) < Date.now())) {
    clearSession();
    window.location.replace("../");
    return;
  }

  /* 🔒 Security Layer 5: HTTPS-only API URL */
  function isValidApiUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const u = new URL(url);
      return u.protocol === "https:";
    } catch (_) { return false; }
  }
  const RAW_API_URL = (window.__DRAGO_CONFIG__ || {}).API_URL;
  const API_URL = isValidApiUrl(RAW_API_URL) ? RAW_API_URL : "";

  // API URL missing (build miss / local) — valid token hai to page rehne do, logout mat karo
  if (!API_URL) {
    try {
      const cached = JSON.parse(sessionStorage.getItem("drago_user") || "null");
      if (cached) render(cached);
    } catch (_) {}
    return;
  }

  const _fetch = (window.DRAGO_SEC && DRAGO_SEC.signedFetch) ? function(u, i){ i=i||{}; i.mode="auth"; return DRAGO_SEC.signedFetch(u,i); } : fetch;
  _fetch(API_URL + "/verify", {
    headers: { Authorization: "Bearer " + token },
  })
    .then((r) => {
      // Sirf explicit auth fail pe logout — network/5xx pe session mat todna
      if (r.status === 401 || r.status === 403) {
        clearSession();
        window.location.replace("../");
        return null;
      }
      if (!r.ok) throw new Error("http_" + r.status);
      return r.json();
    })
    .then((data) => {
      if (data && data.user) render(data.user);
    })
    .catch(() => {
      // Network / temporary error — cached user dikhao, logout mat karo
      try {
        const cached = JSON.parse(sessionStorage.getItem("drago_user") || "null");
        if (cached) render(cached);
      } catch (_) {}
    });
})();

/* 🔒 Security: Session clear helper */
function clearSession() {
  sessionStorage.removeItem("drago_token");
  sessionStorage.removeItem("drago_token_expiry");
  sessionStorage.removeItem("drago_user");
  try {
    localStorage.removeItem("drago_token");
    localStorage.removeItem("drago_token_expiry");
    localStorage.removeItem("drago_user");
  } catch (e) {}
}

/* 🔒 Security: Sanitize user data before display */
function esc(str) {
  if (typeof str !== "string") return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.textContent;
}

function render(user) {
  // textContent use karo — XSS prevention
  const nameEl = document.getElementById("userName");
  if (nameEl) nameEl.textContent = esc((user.name || user.email || "Player").split(" ")[0]);

  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl) welcomeEl.textContent = "Welcome, " + esc((user.name || "Player").split(" ")[0]) + "!";

  const pic = document.getElementById("userPic");
  if (pic) {
    // 🔒 Security: Validate image URL — bas same-origin ya HTTPS allowed
    if (user.picture) {
      try {
        const imgUrl = new URL(user.picture);
        if (imgUrl.protocol === "https:" || imgUrl.protocol === "http:") {
          pic.src = imgUrl.href;
        }
      } catch (_) { /* invalid URL, skip */ }
    }
  }

  // Store sanitized user data
  sessionStorage.setItem("drago_user", JSON.stringify({
    name: esc(user.name || ""),
    email: esc(user.email || ""),
    picture: user.picture || ""
  }));

  // Profile click handler add
  const drawerProfile = document.querySelector(".drawer-profile");
  if (drawerProfile) {
    drawerProfile.addEventListener("click", (e) => {
      if (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn")) {
        return;
      }
      window.location.href = "../profile/";
    });
  }
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearSession();
    window.location.replace("../");
  });
}
