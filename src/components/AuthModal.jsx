// AuthModal.jsx — Sign-in overlay
//
// Renders a bottom-sheet modal with three social sign-in buttons.
// Tapping a button calls the matching function in firebase/auth.js,
// which opens a popup window handled entirely by Firebase. On success,
// firebase/auth.js resolves and AuthContext.jsx's onAuthStateChanged
// listener fires, updating currentUser and loading the user's profile
// from Firestore (via firebase/db.js → getOrCreateUserProfile).
//
// FLOW:
//   User taps "Sign in" in App.jsx header
//     → App sets showAuth=true → this modal renders
//     → User taps a provider button
//     → handleSignIn() calls the firebase/auth.js helper (e.g. signInWithGoogle)
//     → Firebase opens an OAuth popup
//     → On success: AuthContext picks up the new user, this modal closes
//     → On popup-closed: silently does nothing (user changed their mind)
//     → On other error: shows an error message inside the modal

import { useState } from 'react'

// These three functions are defined in firebase/auth.js.
// Each wraps Firebase's signInWithPopup() for a specific identity provider.
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '../firebase/auth'

// ── Provider icon SVGs ────────────────────────────────────────────────────────
// Inline SVGs avoid external image requests and stay perfectly crisp at any
// screen density. aria-hidden="true" hides them from screen readers because
// the parent button already has a visible label.

function GoogleIcon() {
  // Four paths make Google's "G" logo — each path is one color segment.
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
    // Apple's logo — two paths make the apple body and leaf
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
    </svg>
  )
}

// PROVIDERS is an array of configuration objects — one per sign-in method.
// Storing the button config as data (rather than three near-identical JSX blocks)
// means adding a new provider later only requires adding one object here.
// Each object holds:
//   fn    — the firebase/auth.js function to call when this button is clicked
//   Icon  — the SVG icon component to render inside the button
//   style — the brand-correct colors for this button's background/border/text
const PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    fn: signInWithGoogle,           // defined in firebase/auth.js
    Icon: GoogleIcon,
    style: { background: 'white', color: '#3c4043', border: '2px solid #DADCE0' },
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    fn: signInWithFacebook,         // defined in firebase/auth.js
    Icon: FacebookIcon,
    style: { background: '#1877F2', color: 'white', border: '2px solid #1877F2' },
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    fn: signInWithApple,            // defined in firebase/auth.js
    Icon: AppleIcon,
    style: { background: '#000000', color: 'white', border: '2px solid #000000' },
  },
]

// Props:
//   onClose — callback from App.jsx to hide this modal (sets showAuth=false)
export default function AuthModal({ onClose }) {
  // loading tracks which provider button is currently mid-request (null = none).
  // Using the provider id (e.g. 'google') instead of a boolean lets us show
  // a spinner on just the active button while disabling the others.
  const [loading, setLoading] = useState(null)
  const [error,   setError]   = useState('')

  async function handleSignIn(provider) {
    setLoading(provider.id)   // show spinner on this button
    setError('')              // clear any previous error

    try {
      await provider.fn()     // opens the OAuth popup; resolves on success
      // On success, AuthContext.jsx's onAuthStateChanged fires automatically
      // and updates currentUser across the whole app. We just close the modal.
      onClose()
    } catch (err) {
      // 'auth/popup-closed-by-user' is not an error — the user just closed the
      // popup window. All other errors (network failure, misconfigured Firebase,
      // etc.) are worth surfacing to the user.
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(null)  // always clear the spinner when done
    }
  }

  return (
    // Clicking the semi-transparent overlay backdrop calls onClose
    // (same as the X button). stopPropagation on the inner box prevents
    // a click inside the modal from bubbling up and also triggering onClose.
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-header">
          <div className="auth-logo">⛽</div>
          <h2>Sign in to Split Tank</h2>
          <p>Save your car, link payment handles, and split with friends in seconds.</p>
        </div>

        {/* Render one button per provider using PROVIDERS array defined above.
            key={provider.id} is React's required hint for efficient list updates.
            disabled={!!loading} disables ALL buttons while any one is in-flight
            (!! converts any truthy string to true, null to false). */}
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
              {/* Show "Signing in…" only on the button that is actively loading */}
              <span>{loading === provider.id ? 'Signing in…' : provider.label}</span>
            </button>
          ))}
        </div>

        {/* Only rendered when there's an actual error string */}
        {error && <p className="auth-error">{error}</p>}

        <p className="auth-fine-print">
          Your info is only used to pre-fill the calculator and share payment handles with friends.
        </p>
      </div>
    </div>
  )
}
