import { createContext, useContext, useEffect, useState } from 'react'
import { auth, isFirebaseEnabled } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { getOrCreateUserProfile, updateUserProfile, loadFriends } from '../firebase/db'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null)
  const [userProfile,  setUserProfile]  = useState(null)
  const [friends,      setFriends]      = useState([])
  const [authLoading,  setAuthLoading]  = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled) {
      setAuthLoading(false)
      return
    }

    return onAuthStateChanged(auth, async firebaseUser => {
      setCurrentUser(firebaseUser)
      if (firebaseUser) {
        const profile = await getOrCreateUserProfile(firebaseUser)
        setUserProfile(profile)
        const friendList = await loadFriends(profile.friends || [])
        setFriends(friendList)
      } else {
        setUserProfile(null)
        setFriends([])
      }
      setAuthLoading(false)
    })
  }, [])

  // Persist profile changes and refresh friend list
  async function saveProfile(updates) {
    if (!currentUser) return
    await updateUserProfile(currentUser.uid, updates)
    const merged = { ...userProfile, ...updates }
    setUserProfile(merged)
    // Re-fetch friends if the friends array changed
    if (updates.friends) {
      const friendList = await loadFriends(updates.friends)
      setFriends(friendList)
    }
  }

  async function refreshFriends(friendUids) {
    const friendList = await loadFriends(friendUids)
    setFriends(friendList)
  }

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
