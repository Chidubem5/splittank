// api/eia-gas.js: Vercel serverless proxy for EIA weekly retail gas prices.
//
// Keeps the EIA API key server-side. The browser asks for one or more EIA
// area codes and gets back the latest weekly regular-unleaded price for each.
//
// GET /api/eia-gas?areas=SCA,R1X,Y05LA
// Response: { areas: { SCA: { price: 4.512, period: "2026-11-16" }, ... } }
// Error:    503 if EIA_API_KEY is not configured, 4xx/5xx otherwise.

// EIA duoarea codes are short uppercase alphanumerics (SCA, R1X, Y05LA, ...).
const AREA_RE = /^[A-Z0-9]{2,6}$/
const MAX_AREAS = 80

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  const key = process.env.EIA_API_KEY || process.env.VITE_EIA_API_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })

  const areas = [...new Set(String(req.query.areas || '').split(','))]
    .map(a => a.trim())
    .filter(Boolean)
  if (!areas.length || areas.length > MAX_AREAS || !areas.every(a => AREA_RE.test(a))) {
    return res.status(400).json({ error: 'invalid areas' })
  }

  const url =
    `https://api.eia.gov/v2/petroleum/pri/gnd/data/` +
    `?api_key=${key}` +
    `&frequency=weekly` +
    `&data[0]=value` +
    `&facets[product][]=EPM0` +                          // regular unleaded
    areas.map(a => `&facets[duoarea][]=${a}`).join('') +
    `&sort[0][column]=period` +
    `&sort[0][direction]=desc` +                         // newest first
    `&length=${Math.min(areas.length * 4, 500)}`         // a few weeks per area is plenty

  try {
    const r = await fetch(url)
    if (!r.ok) {
      console.error('[eia-gas] EIA returned', r.status, await r.text())
      return res.status(502).json({ error: 'EIA error' })
    }
    const rows = (await r.json())?.response?.data ?? []

    // Rows are newest-first, so the first row seen per area is the latest week.
    const out = {}
    for (const row of rows) {
      if (row.duoarea && row.value != null && !out[row.duoarea]) {
        out[row.duoarea] = { price: parseFloat(row.value), period: row.period }
      }
    }

    // EIA publishes weekly (Mondays), so cache at the edge for 12 hours.
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400')
    return res.status(200).json({ areas: out })
  } catch {
    return res.status(500).json({ error: 'eia fetch failed' })
  }
}
