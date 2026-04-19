import { db } from './config'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'

export async function getOrCreateUserProfile(firebaseUser) {
  const ref  = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()

  const fresh = {
    uid:         firebaseUser.uid,
    displayName: firebaseUser.displayName || 'User',
    email:       firebaseUser.email       || '',
    photoURL:    firebaseUser.photoURL    || '',
    car:         null,
    payment: {
      venmoHandle:    '',
      cashAppHandle:  '',
      zelleContact:   '',
      appleContact:   '',
    },
    friends: [],
  }
  await setDoc(ref, fresh)
  return fresh
}

export async function updateUserProfile(uid, updates) {
  await setDoc(doc(db, 'users', uid), updates, { merge: true })
}

export async function searchUserByEmail(email) {
  const q    = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function addFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayUnion(friendUid) })
}

export async function removeFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayRemove(friendUid) })
}

export async function loadFriends(friendUids) {
  if (!friendUids?.length) return []
  const snaps = await Promise.all(friendUids.map(id => getDoc(doc(db, 'users', id))))
  return snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }))
}
