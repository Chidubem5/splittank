# Split Tank

**[splittank.com](https://splittank.com)** — Calculate how much gas money you owe someone.

Split Tank takes the guesswork out of splitting gas costs on a road trip or carpool. Enter the trip details, pick the car, and everyone instantly sees exactly what they owe — with a direct link to pay via Venmo or Cash App.

---

## How it works

1. **Trip details** — Enter the miles driven and tap "Use My Location" to detect your state. Gas prices auto-fill from live EIA weekly data and update daily.
2. **The Car** — Select the year, make, and model of the vehicle. MPG pulls automatically from the U.S. Department of Energy's FuelEconomy.gov database, so the calculation adjusts for the actual efficiency of that specific car.
3. **The Crew** — Set the number of passengers and choose whether everyone splits evenly (including the driver) or passengers cover the driver's full cost.
4. **The Total** — The per-person amount computes live as you type. No button press needed.
5. **Pay** — The driver enters their Venmo, Cash App, Zelle, or Apple Pay info. Passengers get a direct payment link with the amount pre-filled.

---

## Features

- **Live gas prices** — Fetches current weekly state averages from the U.S. Energy Information Administration (EIA) API. Falls back to 2024 averages if unavailable.
- **Vehicle MPG lookup** — Year/make/model/trim cascade powered by FuelEconomy.gov. City, highway, and combined MPG all available.
- **Use My Location** — One tap detects your city, county, and state via the device's GPS. No typing required.
- **Flexible splitting** — Split the cost evenly across everyone, or have passengers cover the driver entirely.
- **Payment deep links** — Venmo and Cash App buttons open the app with the exact amount pre-filled. Zelle and Apple Pay also supported.
- **Save your profile** — Sign in with Google, Facebook, or Apple to save your car and payment handles. Add friends so their info pre-fills automatically when they're driving.

---

## Stack

- **React 19 + Vite 8** — frontend
- **Firebase Auth + Firestore** — authentication and user profiles (optional)
- **FuelEconomy.gov API** — vehicle MPG data (public, no key required)
- **EIA API** — live weekly state gas prices (free key at [eia.gov/opendata](https://www.eia.gov/opendata/register.php))
- **OpenStreetMap Nominatim** — reverse geocoding for location detection (free, no key required)
- **Vercel** — hosting with automatic deploys from this repo

---

## Local setup

```bash
git clone https://github.com/Chidubem5/Gas-Money.git
cd Gas-Money
npm install
cp .env.local.example .env.local
# Fill in your Firebase config and EIA API key in .env.local
npm run dev
```

The app runs fully without Firebase (auth features are hidden). It also runs without the EIA key (falls back to static gas prices).
