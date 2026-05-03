import { useState, useRef, useEffect } from 'react'

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

function ApplePayIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1A1A1A" />
      <path d="M16 8.5c.8-1 2-1.5 3.3-1.4-.2 1.4-.8 2.6-1.6 3.4-.8.9-2 1.4-3.2 1.3.1-1.3.7-2.5 1.5-3.3z" fill="white" />
      <path d="M20.5 12.8c-1.5-.9-3.5-.8-5 .1-1-.6-2.1-.9-3.2-.7C10 12.8 8.5 15 8.5 17.4c0 1.6.6 3.5 1.5 4.9.8 1.2 1.6 1.7 2.2 1.7.7 0 1-.4 2-.4.9 0 1.2.4 2 .4.7 0 1.5-.6 2.3-1.8.5-.8.9-1.6 1.2-2.6-1.2-.5-2-1.7-2-3.1 0-1.3.7-2.4 1.8-3z" fill="white" />
    </svg>
  )
}

const METHODS = [
  {
    id: 'venmo',
    name: 'Venmo',
    Icon: VenmoIcon,
    accent: '#3D95CE',
    copyAmount: true,
    getUrl: (handle, amount) =>
      handle ? `https://venmo.com/u/${handle}?txn=pay&amount=${amount}&note=Split%20Tank` : 'https://venmo.com/',
    toast: (amount, handle) =>
      handle ? 'Opening Venmo — amount pre-filled' : `Copied $${amount} — opening Venmo`,
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    Icon: CashAppIcon,
    accent: '#00C244',
    copyAmount: true,
    getUrl: (handle, amount) =>
      handle ? `https://cash.app/$${handle}/${amount}` : 'https://cash.app/',
    toast: (amount, handle) =>
      handle ? 'Opening Cash App — amount pre-filled' : `Copied $${amount} — opening Cash App`,
  },
  {
    id: 'zelle',
    name: 'Zelle',
    Icon: ZelleIcon,
    accent: '#6D1ED4',
    copyAmount: true,
    getUrl: () => 'https://www.zellepay.com/',
    toast: (amount) => `Copied $${amount} — paste in your bank's Zelle`,
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    Icon: ApplePayIcon,
    accent: '#1A1A1A',
    copyAmount: false,
    getUrl: (_, amount) => `sms:?body=${encodeURIComponent(`Here's my gas share: $${amount}`)}`,
    toast: () => 'Opening iMessage — select a contact and tap send',
  },
]

export default function PaymentButtons({ amount, venmoHandle, cashAppHandle, zelleContact, appleContact }) {
  const [selected, setSelected] = useState(null)
  const [open, setOpen]         = useState(false)
  const [toast, setToast]       = useState(null)
  const pickerRef               = useRef(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function pick(method) {
    setSelected(method)
    setOpen(false)
  }

  async function handlePay() {
    if (!selected) return
    const handle =
      selected.id === 'venmo'    ? venmoHandle :
      selected.id === 'cashapp'  ? cashAppHandle :
      selected.id === 'zelle'    ? zelleContact :
      selected.id === 'applepay' ? appleContact : null

    if (selected.copyAmount) {
      try { await navigator.clipboard.writeText(amount) } catch { /* ignore */ }
    }

    setToast(selected.toast(amount, handle))
    setTimeout(() => setToast(null), 4500)

    const url = selected.getUrl(handle, amount)
    if (selected.id === 'applepay') {
      window.location.href = url
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="payment-section">
      <p className="payment-heading">Send your share</p>

      {/* Picker */}
      <div className="payment-picker" ref={pickerRef}>
        <button
          className={`payment-method-btn${open ? ' is-open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? (
            <>
              <span className="pmb-icon"><selected.Icon /></span>
              <span className="pmb-label">{selected.name}</span>
            </>
          ) : (
            <span className="pmb-placeholder">Choose a payment app…</span>
          )}
          <svg className="pmb-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={open ? 'M2 8l4-4 4 4' : 'M2 4l4 4 4-4'}
              stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <ul className="payment-dropdown" role="listbox">
            {METHODS.map(method => (
              <li
                key={method.id}
                className={`payment-option${selected?.id === method.id ? ' is-active' : ''}`}
                role="option"
                aria-selected={selected?.id === method.id}
                onClick={() => pick(method)}
              >
                <span className="pmb-icon"><method.Icon /></span>
                <span className="pdo-name">{method.name}</span>
                {selected?.id === method.id && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: method.accent }}>
                    <path d="M2.5 7l3.5 3.5 5.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pay button */}
      {selected && (
        <button
          className="payment-pay-btn"
          style={{ '--pay-accent': selected.accent }}
          onClick={handlePay}
          aria-label={`Send $${amount} via ${selected.name}`}
        >
          <span className="ppb-icon"><selected.Icon /></span>
          <span className="ppb-text">Send ${amount}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.8 }}>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {toast && <div className="payment-toast" role="status">{toast}</div>}
    </div>
  )
}
