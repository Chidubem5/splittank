// PaymentButtons.jsx
// Renders the row of payment app buttons (Venmo, Cash App, Zelle, Apple Pay).
// When tapped, each button:
//   1. Copies the dollar amount to the clipboard (so it's ready to paste)
//   2. Opens the payment app's deep link URL (takes you directly to the
//      payment screen with the recipient and amount pre-filled)
//   3. Shows a brief toast notification confirming what happened
//
// DEEP LINKING: each payment app registers a URL scheme so other apps
// can launch them directly. For example:
//   https://venmo.com/u/johndoe?txn=pay&amount=15.50  → opens Venmo's pay screen
//   https://cash.app/$johndoe/15.50                   → opens Cash App's pay screen
//   sms:?body=...                                     → opens iMessage (for Apple Pay)

import { useState } from 'react'

// ── Payment app icon components ──────────────────────────────────────────────
// Each icon is an inline SVG so there are no external image dependencies.
// aria-hidden="true" hides them from screen readers (the button's aria-label
// already describes the action).

function VenmoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#3D95CE" />
      <path
        d="M22.5 7.5c.5 1 .75 2 .75 3.2 0 4-3.4 9.2-6.2 12.8H11L8.5 8.3l5-.5 1.5 9.2c1.4-2.3 3.1-5.9 3.1-8.4 0-1.3-.25-2.2-.6-2.9l5 1.8z"
        fill="white"
      />
    </svg>
  )
}

function CashAppIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#00C244" />
      <text x="16" y="22" textAnchor="middle" fontSize="18" fontWeight="900" fill="white">$</text>
    </svg>
  )
}

function ZelleIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#6D1ED4" />
      <text x="16" y="23" textAnchor="middle" fontSize="18" fontWeight="900" fill="white">Z</text>
    </svg>
  )
}

function ApplePayIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1A1A1A" />
      {/* Apple logo — top bite path */}
      <path
        d="M16 8.5c.8-1 2-1.5 3.3-1.4-.2 1.4-.8 2.6-1.6 3.4-.8.9-2 1.4-3.2 1.3.1-1.3.7-2.5 1.5-3.3z"
        fill="white"
      />
      {/* Apple logo — main body */}
      <path
        d="M20.5 12.8c-1.5-.9-3.5-.8-5 .1-1-.6-2.1-.9-3.2-.7C10 12.8 8.5 15 8.5 17.4c0 1.6.6 3.5 1.5 4.9.8 1.2 1.6 1.7 2.2 1.7.7 0 1-.4 2-.4.9 0 1.2.4 2 .4.7 0 1.5-.6 2.3-1.8.5-.8.9-1.6 1.2-2.6-1.2-.5-2-1.7-2-3.1 0-1.3.7-2.4 1.8-3z"
        fill="white"
      />
    </svg>
  )
}

// ── Payment method definitions ────────────────────────────────────────────────
// An array of objects — one per payment app. Storing configuration as data
// (rather than repeating JSX for each button) makes it easy to add new
// payment methods or change properties without touching the render logic.
const METHODS = [
  {
    id: 'venmo',
    name: 'Venmo',
    icon: <VenmoIcon />,
    accent: '#3D95CE',    // brand color used for the button border and amount text
    bg: '#E3F2FD',        // light tint of the brand color for the button background
    copyAmount: true,     // should we copy the amount to clipboard before opening?
    // getUrl builds the deep link: if we have a handle, go directly to their
    // payment page; otherwise just open the app homepage
    getUrl: (handle, amount) =>
      handle
        ? `https://venmo.com/u/${handle}?txn=pay&amount=${amount}&note=Split%20Tank`
        : 'https://venmo.com/',
    // toast message shown to the user after clicking
    toast: (amount, handle) =>
      handle ? 'Opening Venmo — amount pre-filled' : `Copied $${amount} — opening Venmo`,
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    icon: <CashAppIcon />,
    accent: '#00C244',
    bg: '#E8F5E9',
    copyAmount: true,
    getUrl: (handle, amount) =>
      handle
        ? `https://cash.app/$${handle}/${amount}`
        : 'https://cash.app/',
    toast: (amount, handle) =>
      handle ? 'Opening Cash App — amount pre-filled' : `Copied $${amount} — opening Cash App`,
  },
  {
    id: 'zelle',
    name: 'Zelle',
    icon: <ZelleIcon />,
    accent: '#6D1ED4',
    bg: '#F3E5F5',
    copyAmount: true,
    // Zelle has no public deep link — it lives inside bank apps.
    // We copy the amount and send the user to Zelle's website instead.
    getUrl: () => 'https://www.zellepay.com/',
    toast: (amount) => `Copied $${amount} — paste in your bank's Zelle`,
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    icon: <ApplePayIcon />,
    accent: '#1A1A1A',
    bg: '#F5F5F5',
    copyAmount: false,   // amount is included in the iMessage text instead
    // sms: URL scheme opens iMessage with a pre-written text body.
    // encodeURIComponent() encodes spaces and special chars for URLs.
    getUrl: (_, amount) =>
      `sms:?body=${encodeURIComponent(`Here's my gas share: $${amount}`)}`,
    toast: () => 'Opening iMessage — select a contact and tap send',
  },
]

// ─────────────────────────────────────────
// PaymentButtons component
// Props:
//   amount        — the dollar amount each person owes (e.g. "15.42")
//   venmoHandle   — optional Venmo username (without @)
//   cashAppHandle — optional Cash App $cashtag (without $)
//   zelleContact  — optional phone or email for Zelle
//   appleContact  — optional phone number for Apple Pay
// ─────────────────────────────────────────
export default function PaymentButtons({ amount, venmoHandle, cashAppHandle, zelleContact, appleContact }) {
  // toast holds the current notification message, or null if none is showing
  const [toast, setToast] = useState(null)

  const handleClick = async (method) => {
    // Look up which handle corresponds to this payment method
    const handle =
      method.id === 'venmo'    ? venmoHandle :
      method.id === 'cashapp'  ? cashAppHandle :
      method.id === 'zelle'    ? zelleContact :
      method.id === 'applepay' ? appleContact :
      null

    // Copy the amount to clipboard so the user can paste it if needed.
    // navigator.clipboard is async and may fail (e.g. user denied permission).
    // The try/catch with an empty catch ignores failures — not critical.
    if (method.copyAmount) {
      try { await navigator.clipboard.writeText(amount) } catch { /* ignore */ }
    }

    // Show the toast message
    setToast(method.toast(amount, handle))
    // Auto-dismiss after 4.5 seconds using setTimeout (a delayed callback)
    setTimeout(() => setToast(null), 4500)

    // Open the payment app.
    // sms: URLs must use location.href — window.open() blocks them on iOS Safari.
    // All other apps use window.open in a new tab with security attributes.
    const url = method.getUrl(handle, amount)
    if (method.id === 'applepay') {
      window.location.href = url
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="payment-section">
      <p className="payment-heading">Send your share</p>

      {/* Render one button per payment method using .map()
          key={method.id} is required by React to efficiently update the list */}
      <div className="payment-grid">
        {METHODS.map(method => (
          <button
            key={method.id}
            className="payment-btn"
            // CSS custom properties (--pay-accent, --pay-bg) let us pass
            // per-button colors to the stylesheet without inline style props
            style={{ '--pay-accent': method.accent, '--pay-bg': method.bg }}
            onClick={() => handleClick(method)}
            // aria-label gives screen readers a meaningful description
            aria-label={`Send $${amount} via ${method.name}`}
          >
            <span className="pay-icon">{method.icon}</span>
            <span className="pay-name">{method.name}</span>
            <span className="pay-amount">${amount}</span>
          </button>
        ))}
      </div>

      {/* Toast notification — only renders when toast has a value.
          role="status" tells screen readers to announce it automatically. */}
      {toast && (
        <div className="payment-toast" role="status">{toast}</div>
      )}
    </div>
  )
}
