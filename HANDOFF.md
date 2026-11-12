# Split Tank — Project Handoff

**Live site:** https://splittank.com
**Repo:** `Chidubem5/splittank`, connected to Vercel via GitHub (auto-deploys on push to `main`)
**Stack:** React 19 + Vite 8, no backend accounts — every calculation lives in component state and (optionally) the shared URL

---

## What the app does

Split Tank calculates how much each person in a carpool owes for gas. The user enters a route (or types miles directly), picks their state (gas price auto-fills), selects a car from the FuelEconomy.gov database (or flips to Electric mode for EPA efficiency data), and sets the number of passengers. The total and per-person amount compute live as they type — no button press needed.

Passengers can be split evenly, have them cover the driver's full cost, or use custom per-passenger percentages. With 0 passengers the app just shows the solo trip cost.

Once the total appears, the driver's Venmo/Cash App/Zelle/Apple Pay info produces direct pay links and text-message payment requests. "Copy link" encodes the whole trip — including the driver's payment handles and any custom split — into the URL, so a passenger who opens the shared link sees a fully pre-filled, payable result.

There is no sign-in, no account system, and no server-side storage of user data — this was deliberately removed (see "Removed: sign-in / Firebase" below).

---

## Design ("Route")

Journal-style page: warm paper, Instrument Serif headings over Instrument Sans UI
(self-hosted via @fontsource — the CSP only allows `font-src 'self'`). Each section
is a numbered stop on a blue route line drawn in CSS (counters on `.card`).
Colour roles: **blue** = brand and the route itself; **green** = the accent for
every control (selected, on, primary, done); **yellow** = money and fuel (the total's
marker, the amount underline). Tokens live at the top of `App.css`, with a dark set
for night mode (7pm–6am).

## File structure

```
src/
  App.jsx                  — the whole calculator UI + orchestration (single page)
  App.css                  — all styles
  main.jsx                 — React entry point

  api/
    fuelEconomy.js         — FuelEconomy.gov API (year/make/model/MPG/EV cascade)
    gasPrice.js            — AAA/EIA gas price resolution + county→metro-area mapping
    tollInflation.js       — BLS CPI-U year-over-year multiplier (7-day cache)
    counties.js            — Census Bureau county list for the county dropdown

  data/
    gasPrices.js            — static 2024 fallback gas prices by state
    electricityRates.js     — static 2024 residential electricity rates by state
    tollRates.js             — per-state toll event base rates (2024 calibration)
    acronyms.js               — place-name expansion for address autocomplete (e.g. "UCF")

  components/
    RoadHero.jsx            — child-like SVG road scene (car with four riders, trees,
                               utility poles); night variant via the `night` prop
    RoadGallery.jsx          — three serif "journal lines" at the bottom
    SRoadLogo.jsx            — the "S Road" logo mark (header); same art as public/favicon.svg
    PaymentButtons.jsx        — Venmo / Cash App / Zelle / Apple Pay deep-link buttons
    Combobox.jsx               — typeahead input used for year/make/model/trim
    PlaceAutocomplete.jsx      — Mapbox-backed address autocomplete for the route fields
    GasPriceMap.jsx / ElectricityRateMap.jsx — lazy-loaded 50-state heat maps

  utils/
    computeSplit.js          — pure function: total cost + split mode → per-passenger amounts
    sms.js                    — cross-platform sms: deep-link builder (iOS uses &body=, not ?body=)
    stateLookup.js             — point-in-state lookup for route detection (topojson + d3-geo)
    trimPopularity.js          — scores trim strings so the picker defaults to the volume trim
    *.test.js                  — Vitest unit tests for the files above

api/                          — Vercel serverless functions (Node runtime)
  gas-prices.js                — AAA daily price scrape, proxied server-side (CORS)
  electricity.js                — EIA monthly residential electricity rates, proxied
  geocode.js                     — Census Bureau geocoder proxy (CORS)
  tolls.js                        — TomTom routing API toll detection (TOMTOM_KEY stays server-side)

middleware.js                  — Vercel Edge Middleware: serves link-preview bots (iMessage,
                                   Discord, Slack, …) a static HTML page with OG tags reflecting
                                   the shared trip's amount; search engines are excluded so they
                                   index the real app (see comments in the file)

public/
  favicon.svg / favicon.ico / favicon-32.png, apple-touch-icon.png,
  logo-192/512.png, maskable-192/512.png   — the "S Road" logo in every size
  share-card.jpg                         — the link preview (coin photo + lettering), used by
                                           index.html, middleware.js and the Share button.
                                           Previewers cache by image URL: when the image changes,
                                           bump ?v= in index.html and SHARE_CARD_VERSION in
                                           middleware.js

---

## Removed: sign-in / Firebase

The app used to support signing in with Google/Facebook/Apple (Firebase Auth) to save your car,
payment handles, and a friends list that pre-filled a driver's info automatically. That whole
layer — `contexts/AuthContext.jsx`, `firebase/`, `components/AuthModal.jsx`,
`ProfileModal.jsx`, `FriendsPanel.jsx` — was removed:

- Sign-in wasn't necessary for the app's core purpose (splitting a trip's cost).
- The Firestore security rules only checked `request.auth != null` for reads, so any signed-in
  user could read any other user's full profile — including Venmo/Cash App/Zelle/Apple Pay
  contact info — the moment they were added as a friend, with no consent required from the
  other side. Removing the feature removed the exposure entirely rather than patching around it.

If a "save my car and payment info" feature comes back later, do it with `localStorage` first —
there's no need for a backend account system to solve "remember this on my own device."

---

## Environment variables

Copy `.env.local.example` to `.env.local` for local dev. Set the same keys in the Vercel
dashboard under Project → Settings → Environment Variables.

| Variable | Where to get it | Required? |
|---|---|---|
| `VITE_EIA_API_KEY` | https://www.eia.gov/opendata/register.php (free) | For EIA-sourced live gas/electricity prices — AAA prices and static fallbacks work without it |
| `VITE_MAPBOX_TOKEN` | https://account.mapbox.com/access-tokens | Improves address/POI autocomplete — OSM/Census geocoding works without it |
| `TOMTOM_KEY` | Vercel dashboard only, never exposed to the browser | For toll detection via TomTom's routing API — falls back to OSM toll-booth detection without it |

The app runs fully with none of these set, using static fallback data and OSM/Census geocoding.

---

## How the calculator works

All computation is a live IIFE in `App.jsx` that calls the pure `computeSplit()` helper in
`src/utils/computeSplit.js` — no calculate button, no result state:

```js
const liveResult = (() => {
  const m = parseFloat(miles)
  // ... resolve gallons/kWh, gasCost, tollAmount, totalCost from trip + car state ...
  const split = computeSplit({ totalCost, passengers, splitMode, customShares })
  return { ...trip fields, perPerson: split.perPerson, customAmounts, driverAmount, ... }
})()
```

`liveResult` is `null` until miles + gas price (or electricity rate) + MPG (or mi/kWh) are all
filled. The Total section and payment buttons only render when it's non-null.

`computeSplit()` is unit-tested directly (`computeSplit.test.js`) — it's the one place a
per-passenger-amount bug would show up, since it used to return a single `perPerson` number
that every passenger's payment request read, even in custom-split mode. Passengers with
different custom percentages now each get their own amount, both in the results UI and in the
"Request from passengers" text messages.

---

## Payment buttons and requests

`src/components/PaymentButtons.jsx` shows Venmo, Cash App, an iMessage/SMS button (via
`appleContact`), and a Zelle "copy contact" button. In custom-split mode there's no per-user
login to know which passenger is viewing the page, so a "Which passenger are you?" picker
appears above the button so the right amount shows.

- **Venmo:** opens `https://venmo.com/u/{handle}?txn=pay&amount={amount}&note=Split%20Tank`
- **Cash App:** opens `https://cash.app/${handle}/{amount}`
- **SMS/iMessage:** built via `src/utils/sms.js`'s `buildSmsUrl()` — iOS's Messages handler only
  pre-fills the body when it's joined with `&`, not the spec-correct `?`; getting this wrong
  silently opens Messages with an empty draft. Android uses the standard `?body=`.
- Without a handle, Venmo/Cash App buttons open the app homepage instead.

The driver can also text each passenger a payment request directly from "Request from
passengers" — each row uses that passenger's own custom-split amount (or the plain per-person
amount outside custom mode), not a single shared number.

---

## Shared links

`buildShareURL()` in `App.jsx` encodes the full trip into query params: `m` (miles), `st`
(state), `co` (county), `p` (passengers), `sm` (split mode), `cs` (custom share percentages),
`rt` (round trip), `tl` (tolls), `ev`/`mpg`/`er` (EV fields), `gp` (manual gas price), `v`/`ca`
(driver's Venmo/Cash App handles), and `pp` (the headline per-person or solo amount, used by
`middleware.js` to build an accurate link-preview description). Payment handles are included
deliberately — a shared link is meant to let a passenger pay immediately, and without them the
link is just a number with no way to act on it.

Multi-state route detection (`detectRouteStates()`) resolves each sampled route point to a US
state via `src/utils/stateLookup.js`, a client-side point-in-polygon lookup against the same US
states topology `GasPriceMap.jsx` renders — not a per-point reverse-geocode call. The old
approach fired up to 14 parallel requests at Nominatim, whose usage policy caps at 1 req/sec; it
falls back to that Nominatim approach only if the topology fails to load.

---

## Deployment

**Host:** Vercel (auto-deploy from GitHub `main` branch)
**Domain:** splittank.com (Namecheap DNS)

DNS records on Namecheap (BasicDNS mode, not custom nameservers):
- A record: `@` → `76.76.21.21`
- CNAME: `www` → `cname.vercel-dns.com`

To redeploy: push to `main`. Vercel picks it up automatically within ~30 seconds.

To update environment variables: Vercel Dashboard → Project → Settings → Environment Variables →
add/edit → trigger a manual redeploy for changes to take effect.

---

## Known gaps / future work

- **EIA state coverage:** Some states don't have individual weekly data in the EIA API and will
  fall back to 2024 static averages (AAA daily prices cover all 50 states and are tried first).
- **No persistence across devices:** with sign-in removed, there's no way to save a car or
  payment handles beyond the current session/shared link. A `localStorage`-based "remember my
  car and handles on this device" would cover the common case without needing accounts back.
- **Bundle size:** removing Firebase dropped the largest JS chunk from >500 kB to ~335 kB
  (gzipped ~105 kB) — no more Vite bundle-size warning, but worth watching as features are added.
- **Test coverage:** Vitest covers the pure helpers in `src/utils/` and `normalizeCounty`; the
  route/toll/geocoding logic in `App.jsx` itself is still untested (would need mocking several
  external APIs).
- **`prop-types` looks unused but is required:** no source file imports it directly, but
  `react-simple-maps` declares it as a peer dependency and `require()`s it at runtime — removing
  it from `package.json` breaks the gas/electricity heat maps.
