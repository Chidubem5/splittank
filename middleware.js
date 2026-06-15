// Vercel Edge Middleware — runs before static files are served.
// Social / link-preview bots (iMessage, Discord, Slack, WhatsApp, …) receive
// a minimal HTML page whose <head> contains only the og:image tags.
// Without a <script> tag, there is nothing for them to render, so they read
// the og:image and show the coin-on-wood photo instead of screenshotting the
// React app.

export const config = {
  matcher: '/'
}

const BOT_PATTERN =
  /bot|crawl|spider|preview|facebook|twitter|linkedin|slack|discord|whatsapp|applebot|telegram|signal|snapchat|googlebot|bingbot|yandex|duckduckbot|facebookexternalhit|Twitterbot|rogerbot|showyoubot|outbrain|pinterest|developers\.google\.com/i

const PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Split Tank: Split Gas Costs on Any Road Trip</title>
<meta name="description" content="No more gas debates. Split Tank calculates everyone's exact share — live pump prices, your car's real MPG, tolls, and EV support. Free and instant.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://splittank.com">
<meta property="og:title" content="Split Tank: Split Gas Costs on Any Road Trip">
<meta property="og:description" content="No more gas debates. Split Tank calculates everyone's exact share — live pump prices, your car's real MPG, tolls, and EV support. Free and instant.">
<meta property="og:image" content="https://splittank.com/preview.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="654">
<meta property="og:image:alt" content="Split Tank — the gold coin on a wood surface surrounded by other coins">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Split Tank: Split Gas Costs on Any Road Trip">
<meta name="twitter:description" content="No more gas debates. Split Tank calculates everyone's exact share — live pump prices, your car's real MPG, tolls, and EV support.">
<meta name="twitter:image" content="https://splittank.com/preview.jpg">
</head>
<body>
<h1>Split Tank: Split Gas Costs on Any Road Trip</h1>
<p>No more gas debates. Split Tank calculates everyone's exact share — live pump prices, your car's real MPG, tolls, and EV support. Free and instant.</p>
<a href="https://splittank.com">Open Split Tank</a>
</body>
</html>`

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (BOT_PATTERN.test(ua)) {
    return new Response(PREVIEW_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }
  // Not a bot — let Vercel serve the normal React app
}
