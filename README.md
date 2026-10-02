# DRAGO Predictor — SvelteKit

Original vanilla HTML/CSS/JS project ka **SvelteKit migration**. UI 100% same — har page ka
markup, CSS, body classes, assets aur behaviour original se match karta hai.

Original repo: `xxdragomod/Drago-frontend-` (untouched, alag folder me hai)

---

## Setup

```bash
npm install
cp .env.example .env      # values already bhari hui hain
npm run dev               # http://localhost:5173
npm run build             # production build → .vercel/output/
```

## Structure

```
src/
  app.html                    ← common <head>: meta, CSP, viewport, __DRAGO_CONFIG__
  hooks.server.js             ← body class inject (page-dashboard / profile-body-v2 / page-status)
  lib/
    css/
      app.css                 ← @import styles.css + dashboard.css (order yahi fix karta hai)
      styles.css  dashboard.css  profile.css  prediction.css
      <page>-page.css         ← original inline <style> blocks
    pages/                    ← original JS files, VERBATIM copy
  routes/
    +layout.js                ← prerender=true, trailingSlash='always'
    +page.svelte              ← /            (login, group ke bahar)
    security-lock/+page.svelte ← group ke bahar (apne inline styles)
    (app)/                    ← route group, URL pe asar nahi
      +layout.svelte          ← import '$lib/css/app.css'  (common CSS)
      dashboard/+page.svelte
      prediction/+page.svelte
      profile/+page.svelte
      subscription/+page.svelte
      game/+page.svelte
      gameplay/+page.svelte
      status/+page.svelte
      developer/+page.svelte
static/
  assets/images/  assets/games/  assets/js/                ← VERBATIM copy
```

**CSS `static/` me kyun nahi?** `static/` ki files plain serve hoti hain
(`max-age=0, must-revalidate`) — har navigation pe dobara download, jisse
FOUC hota tha. Ab CSS JS se import hoti hai, Vite usse
`/_app/immutable/assets/<name>.<hash>.css` pe hash karke
`public, immutable, max-age=31536000` ke saath serve karta hai.

**`(app)` route group kyun?** Vite page-chunk CSS ko shared CSS se pehle
emit kar deta tha, jisse `profile.css` `dashboard.css` pe override kar raha
tha. Layout CSS page CSS se pehle aata hai, aur `@import` bundle ke andar
ka order fix karta hai — to cascade ab har page pe
`styles → dashboard → page` hai, bilkul original `<link>` order jaisa.

## UI 100% same kaise guarantee hua

1. **CSS untouched** — chaaron stylesheets byte-for-byte copy ki gayi hain aur `<link>` se
   globally load hoti hain (Svelte ki style scoping nahi lagi), bilkul original jaisa.
2. **Page-specific `<style>` blocks** ko alag CSS file me nikaal ke link kiya — global scope
   preserve rahe.
3. **Body classes** (`page-dashboard`, `profile-body-v2`, `page-status`) `hooks.server.js` se
   SSR time pe inject hoti hain, to class HTML me pehle se hoti hai — koi style flash nahi.
4. **Page JS verbatim** — koi logic change nahi, sirf `onMount` me dynamic import.
5. **`data-sveltekit-reload`** — har navigation full page load hai, original MPA jaisa hi.
6. **`trailingSlash: 'always'`** — URLs `/dashboard/` format me, original Vercel config jaisa.
7. **`prerender: true`** — build time pe static HTML banta hai, original deploy jaisa.

### Verification

Har page ka rendered markup original HTML se element-by-element compare kiya gaya
(tag + class + id sequence):

```
✅ /                7 elements   IDENTICAL
✅ /dashboard/      102 elements IDENTICAL
✅ /prediction/     128 elements IDENTICAL
✅ /profile/        154 elements IDENTICAL
✅ /subscription/   228 elements IDENTICAL
✅ /game/           56 elements  IDENTICAL
✅ /gameplay/       72 elements  IDENTICAL
✅ /status/         62 elements  IDENTICAL
✅ /developer/      141 elements IDENTICAL
✅ /security-lock/  7 elements   IDENTICAL

10 identical, 0 different
```

## Config (env)

`window.__DRAGO_CONFIG__` ab env se aata hai, HTML me hardcode nahi:

```
PUBLIC_DRAGO_CONFIG={"API_URL":"...","PUBLIC_API_URL":"...","APP_ID":"...","CLIENT_DOMAIN":"..."}
```

Vercel → Settings → Environment Variables me `PUBLIC_DRAGO_CONFIG` set karo.

> **Note:** `APP_SECRET` isme **nahi** hai. Original project me wo 9 HTML files me
> committed tha — wo ek leak tha. Browser me secret rakhna safe nahi hota, isliye yahan
> deliberately exclude kiya gaya hai.

## Deploy (Vercel, free Hobby plan)

1. Repo push karo
2. Vercel → Import project — SvelteKit auto-detect ho jaata hai
3. Environment variable `PUBLIC_DRAGO_CONFIG` add karo
4. Deploy

`vercel.json` likhne ki zaroorat nahi — `@sveltejs/adapter-vercel` config generate kar deta hai.

---

## Abhi bhi baaki (security — original se inherited)

Ye framework migration se fix nahi hote, alag se karne padenge:

| # | Issue | Kahan |
|---|---|---|
| 1 | `APP_SECRET` rotate karna hai (git history me leak hai) | original repo, 9 HTML files |
| 2 | imgbb API key hardcoded | `src/lib/pages/profile__profile.js:474` |
| 3 | Signing layer — `X-Signature` banta hi nahi (secret ship nahi hota) | `static/assets/js/drago-security.js:99` |
| 4 | `script.js` me `mode: "auth"` invalid fetch option | `src/lib/pages/login.js:146` |
# dragotest
