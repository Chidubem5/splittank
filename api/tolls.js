// Vercel serverless proxy for TomTom Routing API toll detection.
// Accepts origin/destination coordinates and returns raw toll road mileage.
// The frontend applies per-mile rates and CPI inflation so costs adjust over time.
// TOMTOM_KEY must be set in Vercel env vars — never exposed to the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { fromLat, fromLon, toLat, toLon, vehicleType = '2AxlesAuto' } = req.body || {}
  if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
    return res.status(400).json({ error: 'fromLat/fromLon/toLat/toLon required' })
  }

  const key = process.env.TOMTOM_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })

  const travelMode = (vehicleType === '3Axles' || vehicleType === '5Axles') ? 'truck' : 'car'

  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/` +
    `${fromLat},${fromLon}:${toLat},${toLon}/json` +
    `?key=${key}` +
    `&travelMode=${travelMode}` +
    `&sectionType=tollRoad` +
    `&routeRepresentation=polyline`

  try {
    const r = await fetch(url)
    if (!r.ok) {
      const body = await r.text()
      console.error('[tolls] TomTom error', r.status, body)
      return res.status(r.status).json({ error: 'TomTom error' })
    }
    const data = await r.json()
    const route = data.routes?.[0]
    if (!route) return res.status(404).json({ error: 'no route' })

    const tollSections = (route.sections ?? []).filter(s => s.sectionType === 'TOLL_ROAD')
    if (!tollSections.length) return res.status(200).json({ tollMiles: 0 })

    // Flatten leg points for section index lookup
    const points = route.legs?.flatMap(l => l.points) ?? []

    let tollMeters = 0
    for (const sec of tollSections) {
      const pts = points.slice(sec.startPointIndex, sec.endPointIndex + 1)
      for (let i = 1; i < pts.length; i++) {
        const dLat = (pts[i].latitude  - pts[i-1].latitude)  * Math.PI / 180
        const dLon = (pts[i].longitude - pts[i-1].longitude) * Math.PI / 180
        const lat1 = pts[i-1].latitude * Math.PI / 180
        const lat2 = pts[i].latitude   * Math.PI / 180
        const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) ** 2
        tollMeters += 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }
    }

    return res.status(200).json({ tollMiles: parseFloat((tollMeters / 1609.34).toFixed(3)) })
  } catch (err) {
    console.error('[tolls] error', err)
    return res.status(500).json({ error: 'toll lookup failed' })
  }
}
