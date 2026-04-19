# Split Tank — Project Handoff

**Live site:** https://splittank.com  
**Repo:** connected to Vercel via GitHub (auto-deploys on push to `main`)  
**Stack:** React 19 + Vite 8, Firebase Auth + Firestore, no backend

---

## What the app does

Split Tank calculates how much each person in a carpool owes for gas. The user enters trip miles, picks their state (gas price auto-fills from the EIA API), selects a car from the FuelEconomy.gov database, and sets the number of passengers. The total and per-person amount compute live as they type — no button press needed.

Once the total appears, the Driver payment info section shows Venmo and Cash App buttons that deep-link to the payment apps with the amount pre-filled.

Optional sign-in (Google/Facebook/Apple via Firebase) lets users save their car and payment handles, and add friends so a friend's car and payment info can be pre-loaded in one tap.

---

## File structure

```
src/
  App.jsx                  — the whole calculator UI (single page)
  App.css                  — all styles
  main.jsx                 — React entry point

  api/
    fuelEconomy.js         — FuelEconomy.gov API (year/make/model/MPG cascade)
    gasPrice.js            — EIA API for live weekly state gas prices

  data/
    gasPrices.js           — static 2024 EIA fallback prices by state

  components/
    RoadHero.jsx           — SVG road scene at the top (exports RoadHeroSVG + default RoadHero)
    RoadGallery.jsx        — three illustrated panels at the bottom
    PaymentButtons.jsx     — Venmo + Cash App deep-link buttons
    AuthModal.jsx          — Google/Facebook/Apple sign-in modal
    ProfileModal.jsx       — save car + payment handles to Firestore
    FriendsPanel.jsx       — add friends by email, see their car/payment info

  firebase/
    config.js              — Firebase init (gracefully disabled if env vars missing)
    auth.js                — signIn/signOut helpers
    db.js                  — Firestore read/write (user profiles, friends list)

  contexts/
    AuthContext.jsx        — provides currentUser, userProfile, friends, isEnabled

public/
  favicon.svg              — SplitTank logo (vintage gas pump in circular badge)
  .htaccess                — SPA fallback for Apache hosts (not used on Vercel)

.env.local.example         — template for all required environment variables
```

---

## Environment variables

Copy `.env.local.example` to `.env.local` for local dev. Set the same keys in the Vercel dashboard under Project → Settings → Environment Variables.

| Variable | Where to get it | Required? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web app | For auth/profiles |
| `VITE_FIREBASE_AUTH_DOMAIN` | same | For auth/profiles |
| `VITE_FIREBASE_PROJECT_ID` | same | For auth/profiles |
| `VITE_FIREBASE_STORAGE_BUCKET` | same | For auth/profiles |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same | For auth/profiles |
| `VITE_FIREBASE_APP_ID` | same | For auth/profiles |
| `VITE_EIA_API_KEY` | https://www.eia.gov/opendata/register.php (free) | For live gas prices |

The app runs without Firebase (auth + profiles are hidden). It runs without the EIA key (falls back to static 2024 averages).

---

## External APIs

### FuelEconomy.gov
- **URL:** `https://www.fueleconomy.gov/ws/rest`
- **Auth:** none — public, no key needed
- **Usage:** Year → Make → Model → Trim cascade in The Car section. Returns city/highway/combined MPG.
- **File:** `src/api/fuelEconomy.js`

### EIA (Energy Information Administration)
- **URL:** `https://api.eia.gov/v2/petroleum/pri/gnd/data/`
- **Auth:** free API key from https://www.eia.gov/opendata/register.php
- **Usage:** Fetches the most recent weekly regular gasoline price for the selected state. Falls back to `src/data/gasPrices.js` if unavailable.
- **File:** `src/api/gasPrice.js`
- **State code map:** inside `gasPrice.js` — maps full state names to EIA `duoarea` codes (e.g. `California → SCA`). Not all states have weekly individual data; missing ones will fall back to static.

### Firebase
- **Auth:** Google, Facebook, Apple sign-in
- **Firestore:** one collection — `users/{uid}` — stores `displayName`, `email`, `photoURL`, `car` (label + mpgCity/Highway/Combined), `payment` (venmoHandle, cashAppHandle, zelleContact, appleContact), `friends` (array of UIDs)
- **Security rules:** users can read any profile (for friends lookup), write only their own

---

## How the calculator works

All computation is a live IIFE in `App.jsx` — no calculate button, no result state:

```js
const liveResult = (() => {
  const m   = parseFloat(miles)
  const gp  = parseFloat(gasPrice)
  const mpg = activeMpg()           // manual override or API value
  if (!m || !gp || !mpg) return null
  const gallons   = m / mpg
  const totalCost = gallons * gp
  const perPerson = splitMode === 'even'
    ? totalCost / (passengers + 1)  // driver + passengers all pay equally
    : totalCost / passengers        // passengers cover driver entirely
  return { gallons, totalCost, perPerson, ... }
})()
```

`liveResult` is `null` until miles + gas price + MPG are all filled. The Total section and payment buttons only render when it's non-null.

---

## Payment buttons

`src/components/PaymentButtons.jsx` shows Venmo and Cash App.

- **Venmo:** opens `https://venmo.com/u/{handle}?txn=pay&amount={amount}&note=Split%20Tank` (pre-fills amount if handle is provided)
- **Cash App:** opens `https://cash.app/${handle}/{amount}` (pre-fills amount)
- Without a handle, both buttons open the app homepage

The component also copies the amount to clipboard before opening the URL so the user has it available if needed.

---

## Hero SVG

`src/components/RoadHero.jsx` is a fully hand-coded SVG (no image files). Key measurements:

```
viewBox: 0 0 900 260
ROAD_TOP: 198   (where road surface starts)
GROUND_Y: 258   (where tires touch)
Car: white 2008 Toyota RAV4, heading right, centered around x=265
```

The file exports two things:
- `RoadHeroSVG` — the raw `<svg>` element, accepts `preserveAspectRatio` prop
- `default RoadHero` — wrapped in `<div className="road-hero">` for the page

---

## Gallery illustrations

`src/components/RoadGallery.jsx` has three panels:

| Panel | Scene | Notes |
|---|---|---|
| Top (full width) | Open road, clouds, highway signs | Uses `RoadHeroSVG` |
| Bottom left | Carpool — 4 figures in a sedan | Figures drawn first, then car pillars on top, then glass at 18% opacity |
| Bottom right | Friend trip — 3 figures in an SUV | Same layering technique |

**Important:** The figures-inside-car effect works via painter's algorithm — figures must be drawn before the car body or they get covered. The car cabin is drawn as individual pillars (A/B/C pillar paths), not a solid fill, so the figures show through the windows. The window glass tint (light blue, low opacity) is drawn last.

---

## Deployment

**Host:** Vercel (auto-deploy from GitHub `main` branch)  
**Domain:** splittank.com (Namecheap DNS)

DNS records on Namecheap (BasicDNS mode, not custom nameservers):
- A record: `@` → `76.76.21.21`
- CNAME: `www` → `cname.vercel-dns.com`

To redeploy: push to `main`. Vercel picks it up automatically within ~30 seconds.

To update environment variables: Vercel Dashboard → Project → Settings → Environment Variables → add/edit → trigger a manual redeploy for changes to take effect.

---

## Known gaps / future work

- **EIA state coverage:** Some states don't have individual weekly data in the EIA API and will fall back to 2024 static averages. Could improve by fetching the nearest PADD region price instead.
- **Zelle/Apple Pay removed from buttons** — were in the original codebase, removed per product decision. The Firestore user schema still stores `zelleContact` and `appleContact` fields (harmless).
- **Firebase auth providers:** Facebook and Apple require additional setup (Facebook App ID + Secret; Apple Developer account + Service ID). Google works out of the box with just the Firebase config.
- **No tests** — the codebase has no test suite. The app is simple enough that manual testing covers the main flows.
- **Bundle size warning:** Vite warns the JS bundle exceeds 500 kB. Not a problem for an MVP but could be improved with dynamic imports if needed.
