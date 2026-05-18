import { useState } from 'react'

function VenmoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#3D95CE" />
      <path d="M22.5 7.5c.5 1 .75 2 .75 3.2 0 4-3.4 9.2-6.2 12.8H11L8.5 8.3l5-.5 1.5 9.2c1.4-2.3 3.1-5.9 3.1-8.4 0-1.3-.25-2.2-.6-2.9l5 1.8z" fill="white" />
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

function MessageIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#34C759" />
      <path d="M7 9h18a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 25 22H12l-6 4V10.5A1.5 1.5 0 0 1 7 9z" fill="white" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ opacity: 0.75, flexShrink: 0 }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Returns true if the string looks like a phone number (not an email).
// Used to decide whether a zelleContact should open SMS or just be copied.
function isPhone(str) {
  const digits = str.replace(/\D/g, '')
  return digits.length >= 7 && /^[\d\s\-().+]+$/.test(str.trim())
}

export default function PaymentButtons({ amount, venmoHandle, cashAppHandle, zelleContact, appleContact }) {
  const [toast, setToast]           = useState(null)
  const [lastClicked, setLastClicked] = useState(null) // tracks which button was last tapped for fallback hint

  function fire(msg, key) {
    setToast(msg)
    setLastClicked(key)
    setTimeout(() => setToast(null), 4500)
  }

  function openVenmo() {
    window.open(
      `https://venmo.com/u/${venmoHandle}?txn=pay&amount=${amount}&note=Split%20Tank`,
      '_blank', 'noopener,noreferrer'
    )
    fire('Opening Venmo — recipient and amount pre-filled', 'venmo')
  }

  function openCashApp() {
    window.open(
      `https://cash.app/$${cashAppHandle}/${amount}`,
      '_blank', 'noopener,noreferrer'
    )
    fire('Opening Cash App — recipient and amount pre-filled', 'cashapp')
  }

  // Opens the native Messages app addressed to the driver's phone number.
  // On iPhone this lets the passenger send an Apple Pay payment or just notify.
  function openSMS(phone) {
    const body = `Here's my gas share: $${amount} — sent via Split Tank (splittank.com)`
    window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}`
    fire('Opening Messages — tap send when ready', 'sms')
  }

  // Zelle has no web deep link, so we copy the contact info to clipboard
  // so the passenger can paste it into their bank's Zelle flow.
  async function copyZelle() {
    try { await navigator.clipboard.writeText(zelleContact) } catch { /* ignore */ }
    fire(`Copied "${zelleContact}" — paste it into your bank's Zelle`, 'zelle')
  }

  // SMS is only for Apple Pay (driver's phone number for iMessage).
  // Zelle shows a copy button for both phone numbers and emails — Zelle accepts both.
  const smsPhone = appleContact || null
  const hasZelle = !!zelleContact
  const hasAny   = venmoHandle || cashAppHandle || smsPhone || hasZelle

  return (
    <div className="payment-section">
      <p className="payment-heading">Send your share</p>

      {hasAny ? (
        <div className="payment-direct-list">

          {venmoHandle && (
            <button
              className="payment-direct-btn"
              style={{ '--btn-accent': '#3D95CE' }}
              onClick={openVenmo}
              aria-label={`Pay $${amount} via Venmo to @${venmoHandle}`}
            >
              <span className="pdb-icon"><VenmoIcon /></span>
              <span className="pdb-text">Pay ${amount} via Venmo</span>
              <ArrowIcon />
            </button>
          )}

          {cashAppHandle && (
            <button
              className="payment-direct-btn"
              style={{ '--btn-accent': '#00C244' }}
              onClick={openCashApp}
              aria-label={`Pay $${amount} via Cash App to $${cashAppHandle}`}
            >
              <span className="pdb-icon"><CashAppIcon /></span>
              <span className="pdb-text">Pay ${amount} via Cash App</span>
              <ArrowIcon />
            </button>
          )}

          {smsPhone && (
            <button
              className="payment-direct-btn"
              style={{ '--btn-accent': '#34C759' }}
              onClick={() => openSMS(smsPhone)}
              aria-label="Pay via iMessage or SMS"
            >
              <span className="pdb-icon"><MessageIcon /></span>
              <span className="pdb-text">Pay via iMessage / SMS</span>
              <ArrowIcon />
            </button>
          )}

          {/* Zelle — no universal deep link, so copy the contact (phone or email) to clipboard */}
          {hasZelle && (
            <button
              className="payment-direct-btn"
              style={{ '--btn-accent': '#6D1ED4' }}
              onClick={copyZelle}
              aria-label={`Copy Zelle contact ${zelleContact}`}
            >
              <span className="pdb-icon"><ZelleIcon /></span>
              <span className="pdb-text">Copy Zelle contact</span>
              <span className="pdb-copy-icon" aria-hidden="true">⎘</span>
            </button>
          )}

        </div>
      ) : (
        <p className="payment-no-methods">
          Add a Venmo handle, Cash App $cashtag, or phone number above to get direct pay links.
        </p>
      )}

      {/* Fallback hint shown after tapping — lets the user manually find the recipient if the app didn't open */}
      {lastClicked === 'venmo' && (
        <p className="payment-fallback">
          If Venmo didn't open, search <strong>@{venmoHandle}</strong> in the app.
        </p>
      )}
      {lastClicked === 'cashapp' && (
        <p className="payment-fallback">
          If Cash App didn't open, search <strong>${cashAppHandle}</strong> in the app.
        </p>
      )}

      {toast && <div className="payment-toast" role="status">{toast}</div>}
    </div>
  )
}
