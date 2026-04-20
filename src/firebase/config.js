// config.js
// Initializes Firebase — the backend-as-a-service that powers:
//   - Auth: Google / Facebook / Apple sign-in
//   - Firestore: cloud database storing user profiles and friend lists
//
// Firebase is OPTIONAL. If the environment variables aren't set
// (e.g. in a local dev environment without a .env file), the app still works
// as a pure calculator — it just won't have sign-in or friends features.
//
// import.meta.env.VITE_* reads from:
//   - Local dev: a .env file at the project root
//   - Production: Vercel "Environment Variables" dashboard settings
// Vite only exposes variables that start with VITE_ to the browser.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// isFirebaseEnabled is true only when both required env vars are present.
// !! converts a value to a boolean (!! "abc" = true, !! "" = false, !! undefined = false).
// && means both sides must be truthy for the result to be truthy.
export const isFirebaseEnabled = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
)

// Start with null — these get assigned below only if Firebase is enabled.
// Using null instead of undefined makes it clear these are intentionally empty.
let auth = null
let db   = null

if (isFirebaseEnabled) {
  // initializeApp registers your Firebase project config with the SDK.
  // Each env var maps to a field in the Firebase project settings.
  const app = initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  })
  auth = getAuth(app)         // auth service: handles sign-in / sign-out
  db   = getFirestore(app)    // database service: reads/writes user data
}

export { auth, db }
