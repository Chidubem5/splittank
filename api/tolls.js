// Vercel serverless proxy for the TollGuru v2 toll calculation API.
// Accepts an encoded polyline and returns the cash toll cost for the route.
// The API key is stored server-side (no VITE_ prefix) so it's never exposed to the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { polyline, vehicleType = '2AxlesAuto' } = req.body || {}
  if (!polyline) return res.status(400).json({ error: 'polyline required' })

  const key = process.env.TOLLGURU_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })

  try {
    const r = await fetch('https://apis.tollguru.com/toll/v2/route-polyline', {
      method: 'POST',
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polyline:    { encodedPolyline: polyline },
        vehicleType,
        units:       { currency: 'USD' },
      }),
    })
    if (!r.ok) return res.status(r.status).json({ error: 'TollGuru error' })
    const data = await r.json()
    // TollGuru returns costs.cash for cash price, costs.minimumTollCost as floor.
    const toll = data?.route?.costs?.cash ?? data?.route?.costs?.minimumTollCost ?? null
    if (toll == null) return res.status(404).json({ error: 'no toll data' })
    return res.status(200).json({ toll: parseFloat(toll.toFixed(2)) })
  } catch {
    return res.status(500).json({ error: 'toll lookup failed' })
  }
}
