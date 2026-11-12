// Vercel Edge Middleware — runs before static files are served.
// Social / link-preview bots (iMessage, Discord, Slack, WhatsApp, …) receive
// a minimal HTML page whose <head> contains only the og:image tags.
// Without a <script> tag, there is nothing for them to render, so they read
// the og:image and show the lettered coin photo (share-card.jpg) instead of screenshotting the
// React app.
//
// Search engines are a different case: they DO render JavaScript and should
// index the real React app, not this two-sentence stub. SEARCH_ENGINE_PATTERN
// is checked first and wins even though "googlebot"/"bingbot" also contain
// the substring "bot" and would otherwise match BOT_PATTERN below.

export const config = {
  matcher: '/'
}

const SEARCH_ENGINE_PATTERN = /googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot/i

const BOT_PATTERN =
  /bot|crawl|spider|preview|facebook|twitter|linkedin|slack|discord|whatsapp|telegram|signal|snapchat|facebookexternalhit|Twitterbot|rogerbot|showyoubot|outbrain|pinterest|developers\.google\.com/i

const DEFAULT_TITLE = 'Split Tank: Split Gas Costs on Any Road Trip'
const DEFAULT_DESCRIPTION =
  "No more gas debates. Split Tank calculates everyone's exact share — live pump prices, your car's real MPG, tolls, and EV support. Free and instant."

// Builds a title/description reflecting the actual shared result when the
// link carries `pp` (per-person or solo amount) — set by buildShareURL() in
// App.jsx from the same computeSplit() output the page itself displays, so
// the preview always matches what the recipient will see. Falls back to the
// generic copy for a bare link (e.g. someone just shares splittank.com).
//
// pp/passengers/miles are parsed as numbers and re-serialized below (never
// echoed as raw strings) — query params are attacker-controlled, and this
// HTML also gets escaped defensively in renderPreviewHTML() before output.
function buildPreviewCopy(searchParams) {
  const pp = parseFloat(searchParams.get('pp'))
  if (isNaN(pp) || pp <= 0) return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }

  const passengers = parseInt(searchParams.get('p') ?? '1', 10)
  const rawMiles = parseFloat(searchParams.get('m'))
  const tripInfo = rawMiles > 0 ? ` on a ${rawMiles.toFixed(1)}-mile trip` : ''

  if (passengers === 0) {
    return {
      title: `$${pp.toFixed(2)} trip cost — Split Tank`,
      description: `Solo trip${tripInfo}: $${pp.toFixed(2)} total. Calculated instantly with live gas prices and real MPG on Split Tank.`,
    }
  }
  return {
    title: `$${pp.toFixed(2)}/person — Split Tank`,
    description: `Each person owes $${pp.toFixed(2)}${tripInfo}. Split gas costs instantly with live pump prices and real MPG on Split Tank.`,
  }
}

// Defense in depth: title/description are built from numbers and static
// string literals above, never raw query-string text, but escaping here
// costs nothing and protects against future params being added carelessly.
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderPreviewHTML({ title, description }) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://splittank.com">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:image" content="https://splittank.com/share-card.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Split Tank: a bronze coin with scales and a gas nozzle on a wooden table, lettered “Split gas money fairly.”">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="https://splittank.com/share-card.jpg">
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDescription}</p>
<a href="https://splittank.com">Open Split Tank</a>
</body>
</html>`
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (SEARCH_ENGINE_PATTERN.test(ua)) return // let Vercel serve the real React app
  if (BOT_PATTERN.test(ua)) {
    const { searchParams } = new URL(request.url)
    return new Response(renderPreviewHTML(buildPreviewCopy(searchParams)), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Shorter cache than before — this response now varies by query string
        // (shared trip amount), so a stale cached copy would show the wrong price.
        'Cache-Control': 'public, max-age=300'
      }
    })
  }
  // Not a bot — let Vercel serve the normal React app
}
