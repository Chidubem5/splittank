// Fetches the current CPI-U (Consumer Price Index for All Urban Consumers)
// from the BLS public API and returns a multiplier relative to the 2024 annual
// average. Apply this multiplier to the base toll rates in tollRates.js so the
// estimates track with overall inflation over time.
//
// BLS API v1 requires no key for single-series requests (max 500 req/day).
// Series CUUR0000SA0 = CPI-U, U.S. city average, All items.
// 2024 annual average ≈ 314.0 — the year the base rates were calibrated.
//
// Cached in localStorage for 7 days: toll rates change slowly, so a weekly
// refresh is more than frequent enough.

const CPI_BASE_2024  = 314.0
const CACHE_KEY      = 'cpi_multiplier'
const CACHE_TTL      = 7 * 24 * 60 * 60 * 1000   // 7 days in milliseconds

// Module-level cache so the fetch only happens once per page load.
let _cached = null

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (Date.now() - c.t < CACHE_TTL) return c.multiplier
  } catch {}
  return null
}

function setCached(multiplier) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ multiplier, t: Date.now() }))
  } catch {}
}

// Returns a number like 1.03 meaning "toll rates are 3% higher than 2024".
// Falls back to 1.0 (no adjustment) on any error so the app never breaks.
export async function fetchTollInflationMultiplier() {
  if (_cached !== null) return _cached

  const stored = getCached()
  if (stored !== null) { _cached = stored; return _cached }

  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/CUUR0000SA0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: ['CUUR0000SA0'], latest: true }),
    })
    if (!res.ok) throw new Error('BLS API error')
    const json = await res.json()
    const entry = json?.Results?.series?.[0]?.data?.[0]
    if (!entry?.value) throw new Error('No CPI value')
    const multiplier = parseFloat(parseFloat(entry.value).toFixed(4)) / CPI_BASE_2024
    _cached = multiplier
    setCached(multiplier)
    return multiplier
  } catch {
    return 1.0
  }
}
