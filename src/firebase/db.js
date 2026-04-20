// db.js
// All Firestore database operations for user profiles and friend lists.
//
// FIRESTORE DATA MODEL:
//   Collection: "users"
//     Document ID: the user's Firebase UID (a unique string like "abc123xyz")
//     Fields:
//       uid, displayName, email, photoURL
//       car: { label, mpgCity, mpgHighway, mpgCombined } | null
//       payment: { venmoHandle, cashAppHandle, zelleContact, appleContact }
//       friends: [ uid1, uid2, ... ]   ← just an array of friend UIDs
//
// Firestore is a "document database" (like JSON, not SQL rows/columns).
// You get a reference to a document first, then read or write it.

import { db } from './config'
import {
  doc,          // get a reference to a specific document
  getDoc,       // read one document
  setDoc,       // write/overwrite a document
  updateDoc,    // update specific fields without overwriting everything
  collection,   // get a reference to a collection
  query,        // build a query (like a SQL WHERE clause)
  where,        // a filter condition for a query
  getDocs,      // execute a query and get all matching documents
  arrayUnion,   // Firestore helper: add to array without duplicates
  arrayRemove,  // Firestore helper: remove from array
} from 'firebase/firestore'

// Get an existing user profile, or create a fresh one if this is their first sign-in.
// This runs every time a user logs in (via AuthContext's onAuthStateChanged).
export async function getOrCreateUserProfile(firebaseUser) {
  const ref  = doc(db, 'users', firebaseUser.uid)  // reference to the document
  const snap = await getDoc(ref)                    // read the document
  if (snap.exists()) return snap.data()             // already has a profile — return it

  // First time signing in: create a blank profile seeded with their Google/Apple data
  const fresh = {
    uid:         firebaseUser.uid,
    displayName: firebaseUser.displayName || 'User',
    email:       firebaseUser.email       || '',
    photoURL:    firebaseUser.photoURL    || '',
    car:         null,        // no car saved yet
    payment: {
      venmoHandle:   '',
      cashAppHandle: '',
      zelleContact:  '',
      appleContact:  '',
    },
    friends: [],              // empty friend list
  }
  await setDoc(ref, fresh)   // write to Firestore
  return fresh
}

// Merge partial updates into the user's profile without overwriting other fields.
// { merge: true } means "only update the fields I'm sending, leave the rest alone."
export async function updateUserProfile(uid, updates) {
  await setDoc(doc(db, 'users', uid), updates, { merge: true })
}

// Search for a user by their exact email address.
// Used in the "Add Friend" feature — you type their email, we find them.
// Returns { id, ...profileData } or null if no match.
export async function searchUserByEmail(email) {
  // Build a query: SELECT * FROM users WHERE email == the input
  const q    = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  // Combine the document ID with the document data into one object
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Add a friend by appending their UID to the "friends" array in Firestore.
// arrayUnion prevents duplicates (safe to call multiple times).
export async function addFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayUnion(friendUid) })
}

// Remove a friend by deleting their UID from the "friends" array.
export async function removeFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayRemove(friendUid) })
}

// Load full profile data for an array of friend UIDs.
// Promise.all() runs all the getDoc calls IN PARALLEL instead of one at a time,
// which is much faster when a user has many friends.
// .filter(s => s.exists()) silently drops any UIDs that no longer have profiles.
export async function loadFriends(friendUids) {
  if (!friendUids?.length) return []
  const snaps = await Promise.all(friendUids.map(id => getDoc(doc(db, 'users', id))))
  return snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))
}
