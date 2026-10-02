/* DRAGO Profile Page — fetch data + actions + drawer */

var currentUser = null;
var toastTimer = null;

(function initProfile() {
  const token = sessionStorage.getItem("drago_token");
  const expiry = sessionStorage.getItem("drago_token_expiry");

  if (!token || (expiry && Number(expiry) < Date.now())) {
    clearSession();
    window.location.replace("../");
    return;
  }

  function isValidApiUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const u = new URL(url);
      return u.protocol === "https:";
    } catch (_) { return false; }
  }
  const RAW_API_URL = (window.__DRAGO_CONFIG__ || {}).API_URL;
  const API_URL = isValidApiUrl(RAW_API_URL) ? RAW_API_URL : "";
  const skeleton = document.getElementById("skeletonView");
  const content  = document.getElementById("profileContent");

  if (skeleton) skeleton.style.display = "block";

  const _fetch = (window.DRAGO_SEC && DRAGO_SEC.signedFetch) ? function(u, i){ i=i||{}; i.mode="auth"; return DRAGO_SEC.signedFetch(u,i); } : fetch;
  _fetch(API_URL + "/profile", {
    headers: { Authorization: "Bearer " + token },
  })
    .then((r) => {
      if (!r.ok) throw new Error("invalid");
      return r.json();
    })
    .then((data) => {
      if (skeleton) skeleton.style.display = "none";
      if (content)  content.style.display  = "block";
      renderProfile(data.user);
    })
    .catch(() => {
      clearSession();
      window.location.replace("../");
    });
})();

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

function esc(str) {
  if (typeof str !== "string") return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.textContent;
}

function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch (_) { return false; }
}

function formatDate(value) {
  if (!value) return "Unknown";
  const d = new Date(value);
  if (isNaN(d.getTime())) return esc(String(value));
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function providerLabel(user) {
  const raw = ((user && (user.provider || user.authProvider)) || "google").toString();
  if (/google/i.test(raw)) return "Google";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function renderProfile(user) {
  user = user || {};
  currentUser = user;

  const pic = document.getElementById("profilePic");
  if (pic && isValidImageUrl(user.picture)) {
    pic.src = user.picture;
  }

  const nameEl = document.getElementById("profileName");
  if (nameEl) nameEl.textContent = esc(user.name || user.email || "Player");

  const subEl = document.getElementById("profileEmailSub");
  if (subEl) subEl.textContent = esc(user.email || "");

  const planPill = document.getElementById("profilePlanPill");
  if (planPill) {
    planPill.textContent = user.is_pro ? "PRO" : "FREE";
    planPill.classList.toggle("is-pro", !!user.is_pro);
  }
  const membershipFootnote = document.getElementById("membershipFootnote");
  if (membershipFootnote) {
    membershipFootnote.textContent = user.is_pro ? "Premium access is active" : "Choose a plan that fits your account";
  }

  const dAvatar = document.getElementById("drawerAvatar");
  if (dAvatar && isValidImageUrl(user.picture)) {
    dAvatar.src = user.picture;
  }
  const dName = document.getElementById("drawerName");
  if (dName) dName.textContent = esc(user.name || user.email || "Player");

  // Pro banner
  const banner = document.getElementById("upgradeBanner");
  const title = banner && banner.querySelector(".upgrade-title");
  const desc = banner && banner.querySelector(".upgrade-desc");
  const btn = document.getElementById("upgradeBtn");
  if (user.is_pro) {
    if (title) title.textContent = "Pro Unlocked";
    if (desc) {
      desc.textContent = user.plan_label
        ? user.plan_label +
          (user.pro_expires_at
            ? " · until " +
              new Date(user.pro_expires_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "")
        : "Premium access active";
    }
    if (btn) {
      btn.textContent = "Active";
      btn.disabled = true;
      btn.style.opacity = "0.85";
    }
    if (banner) banner.classList.add("is-pro");
  } else {
    if (title) title.textContent = "Upgrade to Pro";
    if (desc) desc.textContent = "Unlock premium predictions & priority access";
    if (btn) {
      btn.textContent = "Upgrade";
      btn.disabled = false;
      btn.style.opacity = "";
    }
    if (banner) banner.classList.remove("is-pro");
  }
}

/* ===== TOAST ===== */
function showToast(message, isHtml) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  if (isHtml) toast.innerHTML = message;
  else toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3200);
}

function googleLogoSvg(size) {
  size = size || 18;
  return (
    '<svg class="google-logo" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
      '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
      '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
      '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    '</svg>'
  );
}

/* ===== SUBPAGE ===== */
const subpage = document.getElementById("subpage");
const subpageTitle = document.getElementById("subpageTitle");
const subpageBody = document.getElementById("subpageBody");
const subpageBack = document.getElementById("subpageBack");

function openSubpage(title, html) {
  if (!subpage || !subpageBody) return;
  if (subpageTitle) subpageTitle.textContent = title;
  subpageBody.innerHTML = html;
  subpage.classList.add("open");
  subpage.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSubpage() {
  if (!subpage) return;
  subpage.classList.remove("open");
  subpage.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

subpageBack?.addEventListener("click", closeSubpage);

function detailIcon(type) {
  var icons = {
    name: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    email: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    address: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    plan: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    joined: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    status: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    billing: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'
  };
  return icons[type] || "";
}

function detailRow(label, value, iconType) {
  var iconHtml = iconType
    ? '<span class="detail-icon">' + detailIcon(iconType) + "</span>"
    : "";
  return (
    '<div class="detail-row">' +
      '<span class="detail-label">' + iconHtml + esc(label) + "</span>" +
      '<span class="detail-value">' + esc(value) + "</span>" +
    "</div>"
  );
}

/* ===== ACTIONS ===== */
document.getElementById("authProviderBtn")?.addEventListener("click", function () {
  const name = providerLabel(currentUser);
  const isGoogle = /google/i.test(name);
  const logo = isGoogle ? googleLogoSvg(22) : "";
  const html =
    '<div class="auth-provider-card">' +
      '<div class="auth-provider-icon">' + logo + "</div>" +
      '<div class="auth-provider-name">' + esc(name) + "</div>" +
      '<p class="auth-provider-msg">Your account is signed in with ' + esc(name) + ".</p>" +
    "</div>";
  openSubpage("Auth Provider", html);
});

document.getElementById("personalDetailsBtn")?.addEventListener("click", function () {
  const u = currentUser || {};
  const html =
    '<div class="detail-card">' +
      detailRow("Name", u.name || u.email || "N/A", "name") +
      detailRow("Email", u.email || "N/A", "email") +
      detailRow("Address", u.address || u.location || "Not provided", "address") +
      detailRow("Active Plan", u.is_pro ? (u.plan_label || "Pro") : "Free", "plan") +
      detailRow("Joined", formatDate(u.joinedDate || u.createdAt || u.created_at), "joined") +
    "</div>";
  openSubpage("Personal Details", html);
});

document.getElementById("profileCard")?.addEventListener("click", function () {
  document.getElementById("personalDetailsBtn")?.click();
});

document.getElementById("planBtn")?.addEventListener("click", function () {
  const u = currentUser || {};
  if (u.is_pro) {
    const exp = u.pro_expires_at
      ? new Date(u.pro_expires_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
    // Auto Bet Pro access: ₹500+ plans (beginners / profit)
    const abPlan = ["beginners", "profit"].includes(String(u.pro_plan || ""));
    const html =
      '<div class="detail-card">' +
        detailRow("Current Plan", u.plan_label || "Pro", "plan") +
        detailRow("Status", "Pro Active", "status") +
        detailRow("Auto Bet Pro", abPlan ? "✅ Active" : "Not in this plan", "autobet") +
        detailRow("Expires", exp, "billing") +
      "</div>" +
      '<p class="plan-note">Your Pro access is unlocked.</p>';
    openSubpage("Plan & Subscription", html);
  } else {
    window.location.href = "../subscription/";
  }
});

document.getElementById("preferencesBtn")?.addEventListener("click", function () {
  const html =
    '<div class="pref-card">' +
      '<div class="pref-row">' +
        '<div class="pref-row-text">' +
          "<strong>Notifications</strong>" +
          "<span>Payment & plan alerts</span>" +
        "</div>" +
        '<label class="pref-switch">' +
          '<input type="checkbox" id="prefNotif" />' +
          '<span class="pref-slider"></span>' +
        "</label>" +
      "</div>" +
      '<div class="pref-row">' +
        '<div class="pref-row-text">' +
          "<strong>Sound</strong>" +
          "<span>Soft feedback tones</span>" +
        "</div>" +
        '<label class="pref-switch">' +
          '<input type="checkbox" id="prefSound" />' +
          '<span class="pref-slider"></span>' +
        "</label>" +
      "</div>" +
      '<div class="pref-row">' +
        '<div class="pref-row-text">' +
          "<strong>Compact charts</strong>" +
          "<span>Tighter market bars</span>" +
        "</div>" +
        '<label class="pref-switch">' +
          '<input type="checkbox" id="prefCompact" />' +
          '<span class="pref-slider"></span>' +
        "</label>" +
      "</div>" +
      '<p class="pref-note">Saved on this device only.</p>' +
    "</div>";
  openSubpage("Preferences", html);
  function loadPref(key, el, defVal) {
    if (!el) return;
    try {
      const v = localStorage.getItem(key);
      el.checked = v == null ? !!defVal : v === "1";
    } catch (_) {
      el.checked = !!defVal;
    }
  }
  function bindPref(key, el) {
    if (!el) return;
    el.addEventListener("change", function () {
      try {
        localStorage.setItem(key, el.checked ? "1" : "0");
      } catch (_) {}
    });
  }
  const n = document.getElementById("prefNotif");
  const s = document.getElementById("prefSound");
  const c = document.getElementById("prefCompact");
  loadPref("drago_pref_notif", n, true);
  loadPref("drago_pref_sound", s, false);
  loadPref("drago_pref_compact", c, false);
  bindPref("drago_pref_notif", n);
  bindPref("drago_pref_sound", s);
  bindPref("drago_pref_compact", c);
});

document.getElementById("upgradeBtn")?.addEventListener("click", function () {
  if (currentUser && currentUser.is_pro) return;
  window.location.href = "../subscription/";
});

document.getElementById("privacyBtn")?.addEventListener("click", function () {
  const html =
    '<div class="policy-card">' +
      "<h3>Privacy Policy &amp; Disclaimer</h3>" +
      "<p>Drago Predictor does not support, promote, or encourage any form of gambling.</p>" +
      "<p>This app is an informational and entertainment prediction tool only. It does not offer betting, wagering, or any gambling service.</p>" +
      "<ul>" +
        "<li>We do not support placing bets, winning, or losing money.</li>" +
        "<li>No bets are accepted inside the app. There are no deposits or withdrawals for gambling.</li>" +
        "<li>Predictions shown are for information only and do not guarantee any real-money gambling outcome.</li>" +
        "<li>If a user gambles elsewhere, Drago Predictor is not responsible for any loss.</li>" +
        "<li>We are not partners with any gambling operator, bookie, or betting site.</li>" +
        "<li>This app is intended for users aged 18 and above.</li>" +
      "</ul>" +
      "<p>Account data: Name, email, and profile picture from Google sign-in are stored only to identify your account. We do not sell your data.</p>" +
      '<p class="policy-note">By using this app you agree that Drago Predictor does not support gambling and is not responsible for any gambling activity done outside this app.</p>' +
    "</div>";
  openSubpage("Privacy and Policy", html);
});

document.getElementById("helpBtn")?.addEventListener("click", function () {
  const iconUser =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
  const iconPay =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  const iconFaq =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  /* Inline hero — works even if paymentlogo.png missing; real logo used when present */
  const heroArt =
    '<div class="help-hero-art">' +
      '<img class="help-hero-logo" src="/assets/images/paymentlogo.png?v=3" alt="Help Center" width="280" height="280" onerror="this.onerror=null;this.src=\'/assets/images/paymentlogo.jpg?v=3\'" />' +
    '</div>';

  const html =
    '<div class="help-page">' +
      heroArt +
      '<div class="help-sheet">' +
        '<button type="button" class="help-menu-item" id="helpContactBtn">' +
          '<span class="help-menu-icon gold">' + iconUser + "</span>" +
          '<span class="help-menu-text">Contact &amp; help</span>' +
          '<span class="help-menu-chevron">›</span>' +
        "</button>" +
        '<button type="button" class="help-menu-item" id="helpAppealBtn">' +
          '<span class="help-menu-icon gold">' + iconPay + "</span>" +
          '<span class="help-menu-text">Subscription Not Approve</span>' +
          '<span class="help-menu-chevron">›</span>' +
        "</button>" +
        '<div class="help-faq-block">' +
          '<div class="help-faq-title"><span class="help-menu-icon gold">' + iconFaq + "</span> FAQ</div>" +
          '<div class="help-faq-item">' +
            '<p class="help-faq-q">How do I activate a plan?</p>' +
            '<p class="help-faq-a">Open Subscription → choose plan → pay with UPI → wait for approval.</p>' +
          "</div>" +
          '<div class="help-faq-item">' +
            '<p class="help-faq-q">Paid but plan not active?</p>' +
            '<p class="help-faq-a">Tap “Subscription Not Approve”, enter Payment ID and upload proof.</p>' +
          "</div>" +
          '<div class="help-faq-item">' +
            '<p class="help-faq-q">Where is Payment ID?</p>' +
            '<p class="help-faq-a">Subscription → Payment History → copy icon next to the ID.</p>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>" +
    '<div class="appeal-overlay" id="appealOverlay" aria-hidden="true">' +
      '<div class="appeal-card" role="dialog">' +
        "<h3>Subscription Not Approve</h3>" +
        '<label class="help-appeal-label" for="appealOrderId">Payment ID</label>' +
        '<input class="help-input" id="appealOrderId" type="text" placeholder="Paste Payment ID" autocomplete="off" />' +
        '<label class="help-appeal-label">Payment proof</label>' +
        '<img class="appeal-preview" id="appealPreview" alt="Preview" />' +
        '<label class="appeal-file-btn" for="appealFileInput">Upload screenshot</label>' +
        '<input type="file" id="appealFileInput" accept="image/*" style="display:none" />' +
        '<div class="appeal-actions">' +
          '<button type="button" class="appeal-submit" id="appealSubmitBtn">Submit</button>' +
          '<button type="button" class="appeal-cancel" id="appealCancelBtn">Close</button>' +
        "</div>" +
        '<p class="help-msg" id="appealMsg"></p>' +
      "</div>" +
    "</div>";

  openSubpage("Help & Support", html);

  document.getElementById("helpContactBtn")?.addEventListener("click", function () {
    window.open("https://t.me/xx_drago", "_blank", "noopener,noreferrer");
  });

  const overlay = document.getElementById("appealOverlay");
  const fileInput = document.getElementById("appealFileInput");
  const preview = document.getElementById("appealPreview");
  const submitBtn = document.getElementById("appealSubmitBtn");
  const orderInput = document.getElementById("appealOrderId");
  const msg = document.getElementById("appealMsg");
  let proofFile = null;

  function showOverlay() {
    overlay?.classList.add("show");
    overlay?.setAttribute("aria-hidden", "false");
  }
  function hideOverlay() {
    overlay?.classList.remove("show");
    overlay?.setAttribute("aria-hidden", "true");
    proofFile = null;
    if (fileInput) fileInput.value = "";
    if (preview) {
      preview.src = "";
      preview.classList.remove("show");
    }
    if (msg) {
      msg.textContent = "";
      msg.className = "help-msg";
    }
  }

  document.getElementById("helpAppealBtn")?.addEventListener("click", showOverlay);
  document.getElementById("appealCancelBtn")?.addEventListener("click", hideOverlay);
  overlay?.addEventListener("click", function (e) {
    if (e.target === overlay) hideOverlay();
  });

  fileInput?.addEventListener("change", function () {
    const f = fileInput.files && fileInput.files[0];
    proofFile = f || null;
    if (f && preview) {
      preview.src = URL.createObjectURL(f);
      preview.classList.add("show");
    }
  });

  async function uploadToImgbb(file) {
    const key = "6142948bcadb2c67ba10e4f77fd96a72";
    const fd = new FormData();
    fd.append("image", file);
    const r = await fetch("https://api.imgbb.com/1/upload?key=" + key, {
      method: "POST",
      body: fd,
    });
    const j = await r.json();
    if (!j?.success || !j?.data?.url) {
      throw new Error(j?.error?.message || "Image upload failed");
    }
    return j.data.url || j.data.display_url;
  }

  submitBtn?.addEventListener("click", async function () {
    const orderId = (orderInput?.value || "").trim();
    if (!orderId || orderId.length < 6) {
      if (msg) {
        msg.textContent = "Enter a valid Payment ID.";
        msg.className = "help-msg err";
      }
      return;
    }
    if (!proofFile) {
      if (msg) {
        msg.textContent = "Upload payment proof image.";
        msg.className = "help-msg err";
      }
      return;
    }
    const api = String((window.__DRAGO_CONFIG__ || {}).API_URL || "").replace(/\/$/, "");
    const token = sessionStorage.getItem("drago_token") || "";
    if (!api || !token) {
      if (msg) {
        msg.textContent = "Please login again.";
        msg.className = "help-msg err";
      }
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading…";
    if (msg) {
      msg.textContent = "";
      msg.className = "help-msg";
    }
    try {
      const proofUrl = await uploadToImgbb(proofFile);
      submitBtn.textContent = "Sending…";
      const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      };
      const body = JSON.stringify({ order_id: orderId, proof_image_url: proofUrl });
      const doFetch =
        window.DRAGO_SEC && DRAGO_SEC.signedFetch
          ? DRAGO_SEC.signedFetch(api + "/payment-appeal", {
              method: "POST",
              headers,
              body,
              mode: "payment",
            })
          : fetch(api + "/payment-appeal", { method: "POST", headers, body });
      const r = await doFetch;
      const j = await r.json().catch(() => null);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      if (!r.ok || !j?.success) {
        if (msg) {
          msg.textContent = j?.message || "Appeal failed. Try again.";
          msg.className = "help-msg err";
        }
        return;
      }
      if (msg) {
        msg.textContent = "Appeal sent. Admin will review.";
        msg.className = "help-msg ok";
      }
      if (orderInput) orderInput.value = "";
      setTimeout(hideOverlay, 1100);
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      if (msg) {
        msg.textContent = e?.message || "Upload failed.";
        msg.className = "help-msg err";
      }
    }
  });
});

/* ===== LOGOUT ===== */
function doLogout() {
  clearSession();
  window.location.replace("../");
}
document.getElementById("logoutBtn2")?.addEventListener("click", doLogout);
document.getElementById("logoutBtnDrawer")?.addEventListener("click", doLogout);

/* ===== DRAWER ===== */
const menuBtn       = document.getElementById("menuBtn");
const sideDrawer    = document.getElementById("sideDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose   = document.getElementById("drawerClose");
var drawerOpened = false;

function forceOpenDrawer() {
  if (!sideDrawer || !drawerOverlay) return;
  drawerOpened = true;
  sideDrawer.style.setProperty("left", "0", "important");
  sideDrawer.style.setProperty("transform", "translateX(0)", "important");
  sideDrawer.style.setProperty("-webkit-transform", "translateX(0)", "important");
  sideDrawer.style.setProperty("visibility", "visible", "important");
  sideDrawer.style.setProperty("display", "flex", "important");
  sideDrawer.style.setProperty("z-index", "10000", "important");
  drawerOverlay.style.setProperty("opacity", "1", "important");
  drawerOverlay.style.setProperty("visibility", "visible", "important");
  drawerOverlay.style.setProperty("pointer-events", "auto", "important");
  drawerOverlay.style.setProperty("display", "block", "important");
  sideDrawer.classList.add("open", "drawer-open", "active");
  drawerOverlay.classList.add("open", "drawer-open", "active", "show");
  document.body.classList.add("drawer-is-open", "drawer-open");
  document.body.style.overflow = "hidden";
  sideDrawer.setAttribute("aria-hidden", "false");
  menuBtn && menuBtn.setAttribute("aria-expanded", "true");
}

function forceCloseDrawer() {
  if (!sideDrawer || !drawerOverlay) return;
  drawerOpened = false;
  sideDrawer.style.setProperty("transform", "translateX(-110%)", "important");
  sideDrawer.style.setProperty("-webkit-transform", "translateX(-110%)", "important");
  drawerOverlay.style.setProperty("opacity", "0", "important");
  drawerOverlay.style.setProperty("visibility", "hidden", "important");
  drawerOverlay.style.setProperty("pointer-events", "none", "important");
  sideDrawer.classList.remove("open", "drawer-open", "active");
  drawerOverlay.classList.remove("open", "drawer-open", "active", "show");
  document.body.classList.remove("drawer-is-open", "drawer-open");
  document.body.style.overflow = "";
  sideDrawer.setAttribute("aria-hidden", "true");
  menuBtn && menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn?.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  if (drawerOpened) forceCloseDrawer();
  else forceOpenDrawer();
}, true);
drawerClose?.addEventListener("click", function (e) {
  e.preventDefault();
  forceCloseDrawer();
}, true);

drawerOverlay?.addEventListener("click", forceCloseDrawer, true);

document.getElementById("drawerNavDashboard")?.addEventListener("click", function () {
  forceCloseDrawer();
});
document.getElementById("drawerProfileLink")?.addEventListener("click", function (e) {
  if (e.target.id === "logoutBtnDrawer" || e.target.closest("#logoutBtnDrawer")) return;
  forceCloseDrawer();
});