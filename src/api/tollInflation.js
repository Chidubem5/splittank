// Fetches CPI-U (Consumer Price Index for All Urban Consumers) from the BLS
// public API and returns a year-over-year inflation multiplier. No hardcoded
// base year — always compares the most recent available month to the same
// month twelve months prior so the rate stays current automatically.
//
// BLS API v1 requires no key (max ~500 req/day).
// Series CUUR0000SA0 = CPI-U, U.S. city average, All items.
// BLS publishes new monthly data once a month; this cache expires weekly so
// the multiplier is refreshed within a week of each new release.

const CACHE_KEY = 'cpi_yoy_multiplier'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000   // 7 days

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

// Returns a multiplier like 1.028 (2.8% YoY inflation) by dividing the latest
// available CPI reading by the reading from the same month one year earlier.
// Falls back to 1.0 silently on any error so toll estimates are never broken.
export async function fetchTollInflationMultiplier() {
  if (_cached !== null) return _cached

  const stored = getCached()
  if (stored !== null) { _cached = stored; return _cached }

  try {
    const now         = new Date()
    const currentYear = now.getFullYear()
    const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/CUUR0000SA0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid:  ['CUUR0000SA0'],
        startyear: String(currentYear - 1),
        endyear:   String(currentYear),
      }),
    })
    if (!res.ok) throw new Error('BLS API error')
    const json = await res.json()
    const data = json?.Results?.series?.[0]?.data   // newest first
    if (!Array.isArray(data) || data.length < 2) throw new Error('Insufficient CPI data')

    // data[0] is the most recent month (e.g. "2026-M03").
    // Find the entry from the same month one year earlier.
    const latest  = data[0]
    const yearAgo = data.find(d => d.year === String(parseInt(latest.year) - 1) && d.period === latest.period)
    if (!yearAgo?.value) throw new Error('No year-ago CPI value')

    const multiplier = parseFloat(latest.value) / parseFloat(yearAgo.value)
    _cached = multiplier
    setCached(multiplier)
    return multiplier
  } catch {
    return 1.0
  }
}
