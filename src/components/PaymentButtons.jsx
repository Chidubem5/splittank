import { useState } from 'react'

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
      <path
        d="M16 8.5c.8-1 2-1.5 3.3-1.4-.2 1.4-.8 2.6-1.6 3.4-.8.9-2 1.4-3.2 1.3.1-1.3.7-2.5 1.5-3.3z"
        fill="white"
      />
      <path
        d="M20.5 12.8c-1.5-.9-3.5-.8-5 .1-1-.6-2.1-.9-3.2-.7C10 12.8 8.5 15 8.5 17.4c0 1.6.6 3.5 1.5 4.9.8 1.2 1.6 1.7 2.2 1.7.7 0 1-.4 2-.4.9 0 1.2.4 2 .4.7 0 1.5-.6 2.3-1.8.5-.8.9-1.6 1.2-2.6-1.2-.5-2-1.7-2-3.1 0-1.3.7-2.4 1.8-3z"
        fill="white"
      />
    </svg>
  )
}

const METHODS = [
  {
    id: 'venmo',
    name: 'Venmo',
    icon: <VenmoIcon />,
    accent: '#3D95CE',
    bg: '#E3F2FD',
    copyAmount: true,
    getUrl: (handle, amount) =>
      handle
        ? `https://venmo.com/u/${handle}?txn=pay&amount=${amount}&note=Split%20Tank`
        : 'https://venmo.com/',
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
    getUrl: () => 'https://www.zellepay.com/',
    toast: (amount) => `Copied $${amount} — paste in your bank's Zelle`,
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    icon: <ApplePayIcon />,
    accent: '#1A1A1A',
    bg: '#F5F5F5',
    copyAmount: false,
    getUrl: (_, amount) =>
      `sms:?body=${encodeURIComponent(`Here's my gas share: $${amount}`)}`,
    toast: () => 'Opening iMessage — select a contact and tap send',
  },
]

export default function PaymentButtons({ amount, venmoHandle, cashAppHandle, zelleContact, appleContact }) {
  const [toast, setToast] = useState(null)

  const handleClick = async (method) => {
    const handle =
      method.id === 'venmo'     ? venmoHandle :
      method.id === 'cashapp'   ? cashAppHandle :
      method.id === 'zelle'     ? zelleContact :
      method.id === 'applepay'  ? appleContact :
      null

    if (method.copyAmount) {
      try { await navigator.clipboard.writeText(amount) } catch { /* ignore */ }
    }

    setToast(method.toast(amount, handle))
    setTimeout(() => setToast(null), 4500)

    window.open(method.getUrl(handle, amount), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="payment-section">
      <p className="payment-heading">Send your share</p>
      <div className="payment-grid">
        {METHODS.map(method => (
          <button
            key={method.id}
            className="payment-btn"
            style={{ '--pay-accent': method.accent, '--pay-bg': method.bg }}
            onClick={() => handleClick(method)}
            aria-label={`Send $${amount} via ${method.name}`}
          >
            <span className="pay-icon">{method.icon}</span>
            <span className="pay-name">{method.name}</span>
            <span className="pay-amount">${amount}</span>
          </button>
        ))}
      </div>
      {toast && (
        <div className="payment-toast" role="status">{toast}</div>
      )}
    </div>
  )
}
