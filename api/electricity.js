// Vercel serverless proxy for EIA monthly residential electricity rates by state.
// Returns { "California": 0.2410, "Texas": 0.1380, ... } ($/kWh)
// Cached at Vercel's edge for 7 days — electricity rates change at most monthly.
export default async function handler(req, res) {
  const key = process.env.EIA_API_KEY || process.env.VITE_EIA_API_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })

  try {
    // EIA v2: monthly residential retail electricity price, all states, sorted newest first.
    // length=200 covers ~3-4 months for all states (some states lag by 1-2 months).
    // No sectorid facet filter — filter for residential in code instead,
    // since the exact facet value varies across EIA dataset versions.
    // length=600 covers ~4 months × 50 states × 3 sectors comfortably.
    const url =
      `https://api.eia.gov/v2/electricity/retail-sales/data/` +
      `?api_key=${key}` +
      `&frequency=monthly` +
      `&data[0]=price` +
      `&sort[0][column]=period` +
      `&sort[0][direction]=desc` +
      `&length=600`

    const r = await fetch(url)
    if (!r.ok) {
      const errBody = await r.text()
      console.error('[electricity] EIA returned', r.status, errBody)
      return res.status(r.status).json({ error: 'EIA error', detail: errBody })
    }
    const body = await r.json()

    const rows = body?.response?.data ?? []

    // Take the most recent residential period available for each state.
    const latest = {}
    for (const row of rows) {
      if (row.stateid === 'US') continue
      // Filter for residential — sectorid value may be 'residential' or 'RES'
      const sector = (row.sectorid ?? '').toLowerCase()
      if (!sector.includes('res')) continue
      if (!latest[row.stateid] || row.period > latest[row.stateid].period) {
        latest[row.stateid] = row
      }
    }

    // EIA returns price in cents/kWh — convert to $/kWh.
    // stateDescription is the full name used by react-simple-maps ("California", etc.)
    const prices = {}
    let period = null
    for (const row of Object.values(latest)) {
      if (row.stateDescription && row.price != null) {
        prices[row.stateDescription] = parseFloat((row.price / 100).toFixed(4))
        if (!period || row.period > period) period = row.period
      }
    }

    // Cache at the edge for 7 days; serve stale content while revalidating.
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400')
    return res.status(200).json({ prices, period })
  } catch {
    return res.status(500).json({ error: 'electricity fetch failed' })
  }
}
