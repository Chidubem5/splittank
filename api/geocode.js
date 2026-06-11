// Vercel serverless proxy for the US Census Bureau geocoder.
// The Census API has no CORS headers so it can't be called directly from a browser.
// This proxy runs server-side and forwards the result.
export default async function handler(req, res) {
  const { address } = req.query
  if (!address) return res.status(400).json({ error: 'address required' })

  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`
    const r = await fetch(url)
    const data = await r.json()
    const match = data?.result?.addressMatches?.[0]
    if (match) {
      return res.status(200).json({
        lat: match.coordinates.y,
        lon: match.coordinates.x,
        address: match.matchedAddress,
      })
    }
    return res.status(404).json({ error: 'no match' })
  } catch {
    return res.status(500).json({ error: 'geocode failed' })
  }
}
