import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { searchUserByEmail, addFriend, removeFriend } from '../firebase/db'

const PAY_LABELS = {
  venmoHandle:   { label: 'Venmo',     prefix: '@' },
  cashAppHandle: { label: 'Cash App',  prefix: '$' },
  zelleContact:  { label: 'Zelle',     prefix: ''  },
  appleContact:  { label: 'Apple Pay', prefix: ''  },
}

function friendPaymentLine(payment) {
  if (!payment) return null
  for (const [key, { label, prefix }] of Object.entries(PAY_LABELS)) {
    if (payment[key]) return `${label}: ${prefix}${payment[key]}`
  }
  return null
}

function InitialAvatar({ name, size = 36 }) {
  const initial = (name || 'U')[0].toUpperCase()
  const colors  = ['#4FC3F7', '#FFC107', '#A5D6A7', '#EF9A9A', '#CE93D8']
  const color   = colors[initial.charCodeAt(0) % colors.length]
  return (
    <div className="friend-avatar" style={{ width: size, height: size, background: color }}>
      {initial}
    </div>
  )
}

export default function FriendsPanel({ onSelectDriver, onClose }) {
  const { currentUser, userProfile, friends, saveProfile, refreshFriends } = useAuth()

  const [searchEmail,  setSearchEmail]  = useState('')
  const [searchResult, setSearchResult] = useState(null)  // found user
  const [searchMsg,    setSearchMsg]    = useState('')
  const [searching,    setSearching]    = useState(false)
  const [adding,       setAdding]       = useState(false)
  const [removing,     setRemoving]     = useState(null)

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
        setSearchMsg("That's you!")
      } else if ((userProfile.friends || []).includes(found.id)) {
        setSearchMsg('Already in your friends list.')
      } else {
        setSearchResult(found)
      }
    } catch {
      setSearchMsg('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd() {
    if (!searchResult) return
    setAdding(true)
    try {
      await addFriend(currentUser.uid, searchResult.id)
      const updatedFriends = [...(userProfile.friends || []), searchResult.id]
      await saveProfile({ friends: updatedFriends })
      setSearchEmail('')
      setSearchResult(null)
      setSearchMsg(`${searchResult.displayName} added!`)
    } catch {
      setSearchMsg('Could not add friend.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(friendId) {
    setRemoving(friendId)
    try {
      await removeFriend(currentUser.uid, friendId)
      const updatedFriends = (userProfile.friends || []).filter(id => id !== friendId)
      await saveProfile({ friends: updatedFriends })
    } catch {
      // silent
    } finally {
      setRemoving(null)
    }
  }

  function handleUseAsDriver(friend) {
    onSelectDriver(friend)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="modal-title">Friends</h2>
        <p className="modal-subtitle">
          Add a friend so you can pre-fill their car and payment info when they're driving.
        </p>

        {/* Search */}
        <div className="friends-search-row">
          <input
            type="email"
            placeholder="Search by email address…"
            value={searchEmail}
            onChange={e => { setSearchEmail(e.target.value); setSearchResult(null); setSearchMsg('') }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="friends-search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* Search result */}
        {searchResult && (
          <div className="friend-result-card">
            <InitialAvatar name={searchResult.displayName} />
            <div className="friend-info">
              <p className="friend-name">{searchResult.displayName}</p>
              <p className="friend-meta">{searchResult.email}</p>
              {searchResult.car && (
                <p className="friend-meta">{searchResult.car.label}</p>
              )}
            </div>
            <button className="friend-add-btn" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </div>
        )}

        {searchMsg && <p className="friends-msg">{searchMsg}</p>}

        <hr className="modal-divider" />

        {/* Friends list */}
        {friends.length === 0 ? (
          <p className="friends-empty">No friends yet. Search above to add one.</p>
        ) : (
          <div className="friends-list">
            {friends.map(friend => {
              const payLine = friendPaymentLine(friend.payment)
              return (
                <div className="friend-card" key={friend.id}>
                  {friend.photoURL
                    ? <img className="friend-avatar" src={friend.photoURL} alt="" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                    : <InitialAvatar name={friend.displayName} size={42} />
                  }
                  <div className="friend-info">
                    <p className="friend-name">{friend.displayName}</p>
                    {friend.car   && <p className="friend-meta car-meta">{friend.car.label}</p>}
                    {payLine      && <p className="friend-meta pay-meta">{payLine}</p>}
                    {!friend.car  && <p className="friend-meta muted-meta">No car saved yet</p>}
                  </div>
                  <div className="friend-actions">
                    <button
                      className="friend-use-btn"
                      onClick={() => handleUseAsDriver(friend)}
                      disabled={!friend.car}
                      title={!friend.car ? 'Friend has no car saved yet' : `Use ${friend.displayName}'s car`}
                    >
                      Use as driver
                    </button>
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
