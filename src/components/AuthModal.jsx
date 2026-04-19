import { useState } from 'react'
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '../firebase/auth'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2"/>
      <path d="M16.671 15.563l.532-3.49h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.49h3.047V24a12.14 12.14 0 003.75 0v-8.437h2.796z" fill="white"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
    </svg>
  )
}

const PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    fn: signInWithGoogle,
    Icon: GoogleIcon,
    style: { background: 'white', color: '#3c4043', border: '2px solid #DADCE0' },
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    fn: signInWithFacebook,
    Icon: FacebookIcon,
    style: { background: '#1877F2', color: 'white', border: '2px solid #1877F2' },
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    fn: signInWithApple,
    Icon: AppleIcon,
    style: { background: '#000000', color: 'white', border: '2px solid #000000' },
  },
]

export default function AuthModal({ onClose }) {
  const [loading, setLoading] = useState(null)
  const [error,   setError]   = useState('')

  async function handleSignIn(provider) {
    setLoading(provider.id)
    setError('')
    try {
      await provider.fn()
      onClose()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-header">
          <div className="auth-logo">⛽</div>
          <h2>Sign in to Split Tank</h2>
          <p>Save your car, link payment handles, and split with friends in seconds.</p>
        </div>

        <div className="auth-providers">
          {PROVIDERS.map(provider => (
            <button
              key={provider.id}
              className="auth-provider-btn"
              style={provider.style}
              onClick={() => handleSignIn(provider)}
              disabled={!!loading}
            >
              <span className="auth-provider-icon">
                <provider.Icon />
              </span>
              <span>{loading === provider.id ? 'Signing in…' : provider.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-fine-print">
          Your info is only used to pre-fill the calculator and share payment handles with friends.
        </p>
      </div>
    </div>
  )
}
