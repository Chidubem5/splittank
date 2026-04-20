// AuthContext.jsx
// React Context that makes auth state available to every component in the app
// without having to pass it down as props through every level.
//
// HOW REACT CONTEXT WORKS:
//   1. createContext() creates a "channel" that any component can tune into.
//   2. <AuthContext.Provider value={...}> wraps the app and broadcasts data.
//   3. useAuth() (defined below) is the hook any child component calls to
//      receive that data. No props needed — it just works anywhere in the tree.
//
// DATA THIS CONTEXT PROVIDES:
//   currentUser  — the Firebase user object (or null if signed out)
//   userProfile  — the Firestore profile with car/payment data
//   friends      — array of friend profiles
//   authLoading  — true while Firebase is checking if a user is signed in
//   saveProfile  — function to update the user's profile
//   refreshFriends — function to reload the friend list
//   isEnabled    — boolean: false if Firebase vars aren't configured

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, isFirebaseEnabled } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { getOrCreateUserProfile, updateUserProfile, loadFriends } from '../firebase/db'

// Create the context. The null default is only used if a component somehow
// renders outside an <AuthProvider> — that would be a bug.
const AuthContext = createContext(null)

// useAuth is a custom hook — a function that starts with "use" and calls
// built-in React hooks inside. Any component can call useAuth() to get
// the auth state. Convention: name custom hooks starting with "use".
export function useAuth() {
  return useContext(AuthContext)
}

// AuthProvider wraps the entire app in main.jsx.
// "children" = everything nested inside <AuthProvider>...</AuthProvider>.
export function AuthProvider({ children }) {
  // These four pieces of state drive everything auth-related in the app
  const [currentUser,  setCurrentUser]  = useState(null)
  const [userProfile,  setUserProfile]  = useState(null)
  const [friends,      setFriends]      = useState([])
  const [authLoading,  setAuthLoading]  = useState(true)  // start true until Firebase responds

  useEffect(() => {
    // If Firebase isn't configured, immediately mark auth as not loading
    // so the app doesn't sit on a spinner forever
    if (!isFirebaseEnabled) {
      setAuthLoading(false)
      return
    }

    // onAuthStateChanged is a Firebase listener that fires:
    //   - Once immediately with the current user (or null if not signed in)
    //   - Again whenever the user signs in or out
    // It returns an "unsubscribe" function which we return from useEffect
    // so React cleans it up when the component unmounts (memory leak prevention)
    return onAuthStateChanged(auth, async firebaseUser => {
      setCurrentUser(firebaseUser)

      if (firebaseUser) {
        // User is signed in — load or create their profile and friend list
        const profile = await getOrCreateUserProfile(firebaseUser)
        setUserProfile(profile)
        const friendList = await loadFriends(profile.friends || [])
        setFriends(friendList)
      } else {
        // User signed out — clear all their data
        setUserProfile(null)
        setFriends([])
      }
      setAuthLoading(false)
    })
  }, [])  // [] = run only once when the component first mounts

  // Save profile changes to Firestore and update local state immediately
  // so the UI reflects the change without waiting for a re-fetch.
  // The spread operator { ...userProfile, ...updates } merges the objects:
  // existing fields are kept, updated fields are overwritten.
  async function saveProfile(updates) {
    if (!currentUser) return
    await updateUserProfile(currentUser.uid, updates)
    const merged = { ...userProfile, ...updates }
    setUserProfile(merged)
    // If the friends array changed, reload friend profiles from Firestore
    if (updates.friends) {
      const friendList = await loadFriends(updates.friends)
      setFriends(friendList)
    }
  }

  // Reload friend list from Firestore (called after adding/removing a friend)
  async function refreshFriends(friendUids) {
    const friendList = await loadFriends(friendUids)
    setFriends(friendList)
  }

  // Broadcast all auth state to every component inside this provider
  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      friends,
      authLoading,
      saveProfile,
      refreshFriends,
      isEnabled: isFirebaseEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
