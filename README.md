# Split Tank

**[splittank.com](https://splittank.com)** — Calculate how much gas money you owe someone.

Split Tank takes the guesswork out of splitting gas costs on a road trip or carpool. Enter the trip details, pick the car, and everyone instantly sees exactly what they owe — with a direct link to pay via Venmo or Cash App.

No sign-in, no account — every calculation lives in the page and in the URL you share.

---

## How it works

1. **Trip details** — Enter a from/to address to auto-calculate miles, tolls, and (for multi-state trips) a weighted average gas price, or type miles in directly. Tap "Use My Location" to detect your state; gas prices auto-fill from live AAA/EIA data.
2. **The Car** — Select year/make/model/trim and MPG pulls automatically from the U.S. Department of Energy's FuelEconomy.gov database — or flip to Electric mode for EPA efficiency data and a $/kWh rate.
3. **The Crew** — Set the number of passengers (0 for a solo trip) and choose evenly split, passengers-cover-the-driver, or custom per-passenger percentages.
4. **The Total** — Computes live as you type, no button press needed.
5. **Pay** — The driver enters their Venmo, Cash App, Zelle, or Apple Pay info. Passengers get a direct payment link with the amount pre-filled, or the driver can text a payment request straight from the app.

---

## Features

- **Route calculator** — Enter addresses instead of miles; OSRM computes the driving route, distance, and a city/highway split used to blend city vs. highway MPG for accuracy.
- **Multi-state trips** — Detects every state the route passes through (via local point-in-polygon lookup against US Census topology, not per-point API calls), shows a weighted-average gas price, and suggests where to fill up.
- **Live gas prices** — AAA daily state averages with EIA weekly data as a fallback, cached client-side. Falls back to static 2024 averages if both are unavailable.
- **Toll estimation** — Auto-estimates tolls along the route (TomTom routing API, with an OSM toll-booth-detection fallback), inflation-adjusted by vehicle type.
- **Vehicle MPG / EV efficiency lookup** — Year/make/model/trim cascade powered by FuelEconomy.gov, including EPA EV range and mi/kWh data.
- **Use My Location** — One tap detects your city, county, and state via the device's GPS.
- **Flexible splitting** — Even split, passengers-cover-the-driver, or custom per-passenger percentages — including a picker so each passenger can see their own share when a link is shared.
- **Payment deep links** — Venmo and Cash App buttons open the app with the exact amount pre-filled. Zelle and Apple Pay also supported. The driver can text passengers a payment request directly.
- **Shareable links** — "Copy link" encodes the full trip (miles, state, split mode, custom percentages, driver's payment handles) into the URL, so anyone who opens it sees a fully pre-filled, payable result.

---

## Stack

- **React 19 + Vite 8** — frontend, no backend account system
- **FuelEconomy.gov API** — vehicle MPG / EV efficiency data (public, no key required)
- **EIA API** — live weekly state gas prices (free key at [eia.gov/opendata](https://www.eia.gov/opendata/register.php)); AAA daily prices via a Vercel serverless proxy need no key
- **OSRM** — driving routes and distance
- **OpenStreetMap Nominatim / Photon**, **Census TIGER** (via a Vercel proxy), and optionally **Mapbox** — address geocoding, with several fallback levels
- **TomTom Routing API** (optional, server-side) / **Overpass API** — toll estimation
- **Vercel** — hosting, serverless functions (`api/`), and Edge Middleware for link-preview bots

---

## Local setup

```bash
git clone https://github.com/Chidubem5/splittank.git
cd "Gas Money"
npm install
cp .env.local.example .env.local
# Optionally fill in an EIA API key and/or Mapbox token in .env.local
npm run dev
```

The app runs fully without either env var — it falls back to static gas prices and OSM/Census geocoding.

## Tests

```bash
npm test
```

Vitest covers the pure calculation helpers in `src/utils/` (split math, SMS deep-link building, trim scoring) and `normalizeCounty`.
