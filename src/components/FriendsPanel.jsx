// FriendsPanel.jsx — Friends list + "Use as driver" modal
//
// Lets a signed-in user search for friends by email, add/remove them, and
// tap "Use as driver" to pre-fill App.jsx's calculator with their car + payment
// info without typing anything.
//
// HOW IT CONNECTS TO OTHER FILES:
//   • contexts/AuthContext.jsx — useAuth() provides currentUser, userProfile,
//     friends (already-loaded profiles), saveProfile(), and refreshFriends()
//   • firebase/db.js — searchUserByEmail(), addFriend(), removeFriend() are
//     called directly for Firestore reads/writes
//   • App.jsx — receives onSelectDriver(friend) prop; when called, App.jsx's
//     applyDriverFriend() pre-fills year/make/model/MPG and all payment handles
//     from the friend's saved profile (friend.car and friend.payment)
//
// DATA FLOW for "Use as driver":
//   User taps "Use as driver" on a friend card
//   → handleUseAsDriver(friend) calls onSelectDriver(friend) and onClose()
//   → App.jsx's applyDriverFriend(friend) reads friend.car.mpgCombined etc.
//      and friend.payment.venmoHandle etc. to pre-fill the whole calculator

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { searchUserByEmail, addFriend, removeFriend } from '../firebase/db'

// PAY_LABELS maps Firestore payment field names to human-readable labels and
// prefix symbols. Used by friendPaymentLine() to show a one-liner like
// "Venmo: @johndoe" or "Cash App: $johndoe" under a friend's name.
// These keys must match the payment sub-document fields in firebase/db.js.
const PAY_LABELS = {
  venmoHandle:   { label: 'Venmo',     prefix: '@' },
  cashAppHandle: { label: 'Cash App',  prefix: '$' },
  zelleContact:  { label: 'Zelle',     prefix: ''  },
  appleContact:  { label: 'Apple Pay', prefix: ''  },
}

// Returns a single formatted string for the first non-empty payment method
// a friend has on file, e.g. "Venmo: @johndoe". Returns null if none is set.
// Object.entries() converts the PAY_LABELS object to [[key, {label,prefix}], ...]
// so we can iterate key-value pairs with destructuring.
function friendPaymentLine(payment) {
  if (!payment) return null
  for (const [key, { label, prefix }] of Object.entries(PAY_LABELS)) {
    if (payment[key]) return `${label}: ${prefix}${payment[key]}`
  }
  return null
}

// A simple colored-circle avatar that shows the first letter of a name.
// Used when a friend hasn't set a profile photo.
// The color is deterministic: it's derived from the character code of the
// first letter so the same person always gets the same color.
function InitialAvatar({ name, size = 36 }) {
  const initial = (name || 'U')[0].toUpperCase()
  const colors  = ['#4FC3F7', '#FFC107', '#A5D6A7', '#EF9A9A', '#CE93D8']
  // charCodeAt(0) gives the ASCII value of the letter. Modulo 5 maps any
  // letter to an index 0–4 into the colors array. Same letter = same color.
  const color   = colors[initial.charCodeAt(0) % colors.length]
  return (
    <div className="friend-avatar" style={{ width: size, height: size, background: color }}>
      {initial}
    </div>
  )
}

// Props:
//   onSelectDriver(friend) — called when user taps "Use as driver"; received
//                             by App.jsx as applyDriverFriend
//   onClose()              — called to hide this modal (sets showFriends=false in App.jsx)
export default function FriendsPanel({ onSelectDriver, onClose }) {
  // Pull everything we need from AuthContext in one call.
  // friends is the array of fully-loaded friend profiles (not just UIDs) —
  // AuthContext.jsx loads them via loadFriends() in firebase/db.js on sign-in
  // and whenever saveProfile({ friends: [...] }) is called.
  const { currentUser, userProfile, friends, saveProfile, refreshFriends } = useAuth()

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchEmail,  setSearchEmail]  = useState('')
  const [searchResult, setSearchResult] = useState(null)  // the found user object (or null)
  const [searchMsg,    setSearchMsg]    = useState('')     // feedback text (error or success)
  const [searching,    setSearching]    = useState(false)  // true while Firestore query runs
  const [adding,       setAdding]       = useState(false)  // true while addFriend() runs
  const [removing,     setRemoving]     = useState(null)   // the friendId currently being removed

  // Search for a user in Firestore by exact email address.
  // searchUserByEmail() is defined in firebase/db.js — it runs a Firestore
  // WHERE query on the "users" collection.
  async function handleSearch() {
    if (!searchEmail.trim()) return
    setSearching(true)
    setSearchResult(null)
    setSearchMsg('')
    try {
      const found = await searchUserByEmail(searchEmail)
      if (!found) {
        setSearchMsg('No user found with that email.')
      } else if (found.id === currentUser.uid) {
        // Prevent adding yourself — the UID comparison is more reliable than
        // email since emails could theoretically change
        setSearchMsg("That's you!")
      } else if ((userProfile.friends || []).includes(found.id)) {
        setSearchMsg('Already in your friends list.')
      } else {
        // Valid new friend — show their card so the user can confirm before adding
        setSearchResult(found)
      }
    } catch {
      setSearchMsg('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  // Add the found user as a friend.
  // Two writes happen in sequence:
  //   1. addFriend() in firebase/db.js appends the friendId to the Firestore
  //      "friends" array using arrayUnion (prevents duplicates).
  //   2. saveProfile() in AuthContext.jsx also updates the local userProfile
  //      state AND calls refreshFriends() which re-loads the full friend
  //      profiles so the list updates immediately without a page reload.
  async function handleAdd() {
    if (!searchResult) return
    setAdding(true)
    try {
      await addFriend(currentUser.uid, searchResult.id)
      const updatedFriends = [...(userProfile.friends || []), searchResult.id]
      await saveProfile({ friends: updatedFriends })  // triggers AuthContext to reload friends
      setSearchEmail('')
      setSearchResult(null)
      setSearchMsg(`${searchResult.displayName} added!`)
    } catch {
      setSearchMsg('Could not add friend.')
    } finally {
      setAdding(false)
    }
  }

  // Remove a friend. Mirror of handleAdd — uses arrayRemove in Firestore.
  // removing holds the id of the friend being removed so only that row's
  // button shows a spinner.
  async function handleRemove(friendId) {
    setRemoving(friendId)
    try {
      await removeFriend(currentUser.uid, friendId)
      const updatedFriends = (userProfile.friends || []).filter(id => id !== friendId)
      await saveProfile({ friends: updatedFriends })
    } catch {
      // Silent failure — the UI will still show the friend if the remove failed
    } finally {
      setRemoving(null)
    }
  }

  // Called when the user taps "Use as driver" on a friend card.
  // Passes the full friend profile object up to App.jsx's applyDriverFriend(),
  // which reads friend.car.mpgCity/mpgHighway/mpgCombined and
  // friend.payment.venmoHandle etc. to pre-fill the calculator.
  function handleUseAsDriver(friend) {
    onSelectDriver(friend)
    onClose()   // close the panel after selection
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="modal-title">Friends</h2>
        <p className="modal-subtitle">
          Add a friend so you can pre-fill their car and payment info when they're driving.
        </p>

        {/* ── Search row ───────────────────────────────────────────────────── */}
        <div className="friends-search-row">
          <input
            type="email"
            placeholder="Search by email address…"
            value={searchEmail}
            // Clear search result and message as the user types so stale results
            // don't linger while they're correcting a typo
            onChange={e => { setSearchEmail(e.target.value); setSearchResult(null); setSearchMsg('') }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="friends-search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* ── Search result card ───────────────────────────────────────────── */}
        {/* Only rendered after a successful search that found a new-to-you user */}
        {searchResult && (
          <div className="friend-result-card">
            <InitialAvatar name={searchResult.displayName} />
            <div className="friend-info">
              <p className="friend-name">{searchResult.displayName}</p>
              <p className="friend-meta">{searchResult.email}</p>
              {/* Show their saved car label if they have one — from ProfileModal's save */}
              {searchResult.car && (
                <p className="friend-meta">{searchResult.car.label}</p>
              )}
            </div>
            <button className="friend-add-btn" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </div>
        )}

        {/* Feedback text: errors ("No user found"), already-friend notice, success ("Added!") */}
        {searchMsg && <p className="friends-msg">{searchMsg}</p>}

        <hr className="modal-divider" />

        {/* ── Friends list ─────────────────────────────────────────────────── */}
        {/* friends array comes from AuthContext — loaded on sign-in via loadFriends()
            in firebase/db.js, which fetches full profile docs for each UID in
            the user's "friends" array. */}
        {friends.length === 0 ? (
          <p className="friends-empty">No friends yet. Search above to add one.</p>
        ) : (
          <div className="friends-list">
            {friends.map(friend => {
              // Build a one-liner summary of the friend's payment method for display
              const payLine = friendPaymentLine(friend.payment)
              return (
                <div className="friend-card" key={friend.id}>
                  {/* Show their OAuth profile photo if available, else initials avatar */}
                  {friend.photoURL
                    ? <img className="friend-avatar" src={friend.photoURL} alt=""
                           style={{ width: 42, height: 42, borderRadius: '50%' }} />
                    : <InitialAvatar name={friend.displayName} size={42} />
                  }
                  <div className="friend-info">
                    <p className="friend-name">{friend.displayName}</p>
                    {/* Conditionally show car, payment, or "no car" based on what they've saved */}
                    {friend.car  && <p className="friend-meta car-meta">{friend.car.label}</p>}
                    {payLine     && <p className="friend-meta pay-meta">{payLine}</p>}
                    {!friend.car && <p className="friend-meta muted-meta">No car saved yet</p>}
                  </div>
                  <div className="friend-actions">
                    {/* "Use as driver" disabled when friend has no saved car because
                        applyDriverFriend() in App.jsx needs car.mpgCity/mpgHighway/mpgCombined */}
                    <button
                      className="friend-use-btn"
                      onClick={() => handleUseAsDriver(friend)}
                      disabled={!friend.car}
                      title={!friend.car ? 'Friend has no car saved yet' : `Use ${friend.displayName}'s car`}
                    >
                      Use as driver
                    </button>
                    {/* removing === friend.id shows spinner only on this row's button */}
                    <button
                      className="friend-remove-btn"
                      onClick={() => handleRemove(friend.id)}
                      disabled={removing === friend.id}
                    >
                      {removing === friend.id ? '…' : 'Remove'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
