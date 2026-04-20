// auth.js
// Thin wrappers around Firebase sign-in methods.
// Each function opens a popup window (not a redirect) so the user
// doesn't lose their place in the app when they sign in.
//
// "Provider" in Firebase terminology = the identity service
// (Google, Facebook, Apple). Each provider has its own class.
// signInWithPopup() handles the OAuth handshake — it opens the provider's
// login window, waits for the user to approve, then returns the logged-in user.

import { auth } from './config'
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

// Sign in with a Google account (Gmail, Google Workspace, etc.)
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

// Sign in with a Facebook account
export async function signInWithFacebook() {
  const provider = new FacebookAuthProvider()
  return signInWithPopup(auth, provider)
}

// Sign in with an Apple ID.
// We request "email" and "name" scopes so Firebase receives the user's
// name and email from Apple (Apple only shares these on first sign-in).
export async function signInWithApple() {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')
  return signInWithPopup(auth, provider)
}

// Sign out the current user and clear their session.
export async function signOutUser() {
  return signOut(auth)
}
