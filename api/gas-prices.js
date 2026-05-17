// api/gas-prices.js — Vercel serverless function
//
// Fetches AAA's daily state gas price table server-side and returns it as JSON.
// The browser can't call gasprices.aaa.com directly (CORS), so this function
// acts as a same-origin proxy. Vercel caches the response at the CDN edge for
// 6 hours so AAA only gets hit a handful of times per day globally.
//
// Response: { prices: { "Alaska": 5.279, "California": 6.143, ... }, date: "May 17", source: "AAA" }
// Error:    { error: "..." }  with a non-200 status

export default async function handler(req, res) {
  // s-maxage: Vercel CDN caches this for 6 hours
  // stale-while-revalidate: serve the old response for up to 24 more hours
  // while a fresh fetch runs in the background — zero latency for users
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  try {
    const resp = await fetch('https://gasprices.aaa.com/state-gas-price-averages/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (!resp.ok) {
      return res.status(502).json({ error: `AAA returned HTTP ${resp.status}` })
    }

    const html = await resp.text()
    const prices = {}

    // The page is a simple HTML table: each <tr> has a state anchor and dollar prices.
    // We split by <tr to process one row at a time instead of running a regex over
    // the entire document, which avoids catastrophic backtracking on large HTML.
    for (const row of html.split('<tr')) {
      // State name: the first anchor whose text starts with a capital letter
      const stateMatch = row.match(/>\s*([A-Z][a-zA-Z ]+?)\s*<\/a>/)
      // Regular unleaded price: the first $X.XXX in the row
      const priceMatch = row.match(/\$([\d.]+)/)
      if (!stateMatch || !priceMatch) continue

      const state = stateMatch[1].trim()
      const price = parseFloat(priceMatch[1])

      // Sanity-check: skip header cells, nav links, footer text.
      // Valid state names are ≥ 4 chars; valid prices are between $0.50 and $15.
      if (state.length >= 4 && price > 0.5 && price < 15) {
        prices[state] = price
      }
    }

    // If we parsed fewer than 40 states the HTML structure probably changed.
    if (Object.keys(prices).length < 40) {
      return res.status(502).json({
        error: `Only parsed ${Object.keys(prices).length} states — AAA page structure may have changed`,
      })
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    res.status(200).json({ prices, date: today, source: 'AAA' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
