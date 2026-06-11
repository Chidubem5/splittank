// main.jsx — Application entry point
//
// This is the first file the browser executes. Its only job is to mount the
// React component tree into the real DOM. Every other file in the project is
// a module that gets pulled in by something further down the tree.
//
// HOW THE FILES CONNECT FROM HERE:
//   main.jsx
//     └─ AuthProvider  (contexts/AuthContext.jsx)
//           └─ firebase/config.js   ← checks if Firebase env vars exist
//           └─ firebase/db.js       ← reads/writes Firestore user profiles
//         └─ App  (App.jsx)
//               └─ api/fuelEconomy.js   ← vehicle MPG lookup
//               └─ api/gasPrice.js      ← live EIA gas prices
//               └─ api/tollInflation.js ← BLS CPI multiplier for toll rates
//               └─ api/counties.js      ← Census Bureau county list
//               └─ data/gasPrices.js    ← static fallback gas prices
//               └─ data/tollRates.js    ← per-state toll event cost base rates
//               └─ components/...      ← all UI sub-components

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'                               // global reset + CSS custom properties (--blue, --yellow, etc.)
import App from './App.jsx'                        // the entire app lives inside this one component
import { AuthProvider } from './contexts/AuthContext.jsx'

// createRoot() is React 18's way to mount the app.
// It attaches to the <div id="root"> in index.html and takes over rendering.
// Everything rendered by React is injected here at runtime — the actual HTML
// file is just an empty shell until JavaScript runs.
createRoot(document.getElementById('root')).render(
  // StrictMode doesn't change visible behavior. It runs component setup
  // twice in development to help catch side-effects that shouldn't run twice
  // (accidental timers, stale closures, etc.). Has zero effect in production.
  <StrictMode>
    {/* AuthProvider must wrap App so that useAuth() works anywhere in the tree.
        It subscribes to Firebase auth state and broadcasts currentUser,
        userProfile, and friends to every child component via React Context.
        App.jsx and its children call useAuth() to read this data directly
        without needing props passed down through every level. */}
    <AuthProvider>
      <App />
    </AuthProvider>
    <Analytics />
  </StrictMode>,
)
