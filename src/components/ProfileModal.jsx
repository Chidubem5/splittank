// ProfileModal.jsx — "My Profile & Car" modal
//
// Lets a signed-in user save their car (for MPG lookup) and payment handles
// (Venmo, Cash App, Zelle, Apple Pay) to their Firestore profile.
//
// HOW IT CONNECTS TO OTHER FILES:
//   • api/fuelEconomy.js  — same cascading year→make→model→trim→MPG lookups
//     used in App.jsx, duplicated here so the modal is self-contained
//   • contexts/AuthContext.jsx — useAuth() provides currentUser, userProfile,
//     and saveProfile(); saveProfile() writes to Firestore via firebase/db.js
//   • firebase/auth.js — signOutUser() is called when the user taps "Sign out"
//
// DATA SAVED TO FIRESTORE (see firebase/db.js for the schema):
//   car: { year, make, model, trimId, mpgCity, mpgHighway, mpgCombined, label }
//   payment: { venmoHandle, cashAppHandle, zelleContact, appleContact }
//
// When a friend selects this user as "the driver" in App.jsx (via FriendsPanel.jsx),
// App.jsx reads exactly these car and payment fields to pre-fill the calculator.

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'           // currentUser, userProfile, saveProfile
import { getYears, getMakes, getModels, getOptions, getVehicleMPG } from '../api/fuelEconomy'
import { signOutUser } from '../firebase/auth'              // wraps Firebase signOut()

// PAYMENT_FIELDS drives the payment section's input rows.
// Storing field config as data avoids four near-identical JSX blocks.
// id       → key into the payment state object (matches Firestore field names in db.js)
// label    → human-readable section label
// prefix   → '@' for Venmo, '$' for Cash App, '' for others
// placeholder → hint text inside the input
const PAYMENT_FIELDS = [
  { id: 'venmoHandle',   label: 'Venmo',     prefix: '@', placeholder: 'username'       },
  { id: 'cashAppHandle', label: 'Cash App',  prefix: '$', placeholder: 'cashtag'        },
  { id: 'zelleContact',  label: 'Zelle',     prefix: '',  placeholder: 'phone or email' },
  { id: 'appleContact',  label: 'Apple Pay', prefix: '',  placeholder: 'phone or email' },
]

// Props:
//   onClose — callback from App.jsx (sets showProfile=false)
export default function ProfileModal({ onClose }) {
  // Pull auth state from AuthContext. currentUser is the Firebase user object
  // (uid, email, displayName, photoURL). userProfile is the Firestore document
  // loaded by getOrCreateUserProfile() in AuthContext.jsx on sign-in.
  // saveProfile() merges updates into Firestore AND updates local state.
  const { currentUser, userProfile, saveProfile } = useAuth()

  // ── Car cascade state ─────────────────────────────────────────────────────
  // These six states mirror the same cascade in App.jsx.
  // They're initialized from userProfile so the user's saved car is pre-selected.
  // Optional chaining (?.) prevents crashes if userProfile or car is null.
  const [years,         setYears]         = useState([])
  const [year,          setYear]          = useState(userProfile?.car?.year  || '')
  const [makes,         setMakes]         = useState([])
  const [loadingMakes,  setLoadingMakes]  = useState(false)
  const [make,          setMake]          = useState(userProfile?.car?.make  || '')
  const [models,        setModels]        = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [model,         setModel]         = useState(userProfile?.car?.model || '')
  const [options,       setOptions]       = useState([])   // trim/engine variants
  const [trimId,        setTrimId]        = useState(userProfile?.car?.trimId || '')
  const [mpg,           setMpg]           = useState(
    // If the user already has a saved car, reconstruct the MPG object from the
    // flat Firestore fields (mpgCity, mpgHighway, mpgCombined) so the badge
    // shows immediately without a fresh API call.
    userProfile?.car ? {
      city:     userProfile.car.mpgCity     || null,
      highway:  userProfile.car.mpgHighway  || null,
      combined: userProfile.car.mpgCombined || null,
    } : null
  )
  const [loadingMpg, setLoadingMpg] = useState(false)

  // ── Payment state ─────────────────────────────────────────────────────────
  // Single object keyed by field id — matches the PAYMENT_FIELDS ids above
  // and the Firestore payment sub-document schema in firebase/db.js.
  const [payment, setPayment] = useState({
    venmoHandle:   userProfile?.payment?.venmoHandle   || '',
    cashAppHandle: userProfile?.payment?.cashAppHandle || '',
    zelleContact:  userProfile?.payment?.zelleContact  || '',
    appleContact:  userProfile?.payment?.appleContact  || '',
  })

  const [saving, setSaving] = useState(false)  // true while saveProfile() is running
  const [saved,  setSaved]  = useState(false)  // flips true briefly after a successful save

  // ── Load years on mount ───────────────────────────────────────────────────
  // getYears() calls the FuelEconomy.gov API (api/fuelEconomy.js).
  // Empty dependency array [] = runs once when the modal first opens.
  useEffect(() => {
    getYears().then(setYears).catch(() => {})
  }, [])

  // Year → fetch makes; clear everything downstream so stale data never shows
  useEffect(() => {
    if (!year) return
    setMake(''); setMakes([]); setModel(''); setModels([])
    setOptions([]); setTrimId(''); setMpg(null)
    setLoadingMakes(true)
    getMakes(year)
      .then(setMakes)
      .catch(() => {})
      .finally(() => setLoadingMakes(false))
  }, [year])

  // Make → fetch models
  useEffect(() => {
    if (!make) return
    setModel(''); setModels([]); setOptions([]); setTrimId(''); setMpg(null)
    setLoadingModels(true)
    getModels(year, make)
      .then(setModels)
      .catch(() => {})
      .finally(() => setLoadingModels(false))
  }, [make])

  // Model → fetch trim options; if only one trim exists, auto-select it
  useEffect(() => {
    if (!model) return
    setOptions([]); setTrimId(''); setMpg(null)
    setLoadingMpg(true)
    getOptions(year, make, model).then(opts => {
      setOptions(opts)
      if (opts.length === 1) setTrimId(opts[0].value)  // only one option — skip the picker
      else setLoadingMpg(false)
    }).catch(() => setLoadingMpg(false))
  }, [model])

  // Trim selected → fetch MPG from fuelEconomy.js using the numeric vehicle ID
  useEffect(() => {
    if (!trimId) return
    setLoadingMpg(true)
    getVehicleMPG(trimId)
      .then(setMpg)    // sets { city, highway, combined }
      .catch(() => {})
      .finally(() => setLoadingMpg(false))
  }, [trimId])

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    // Build the car object only if all three required fields are filled.
    // null means "user has no car saved" — FriendsPanel.jsx checks for this
    // and disables the "Use as driver" button when car is null.
    const carData = (year && make && model) ? {
      year, make, model,
      trimId:      trimId || '',
      mpgCity:     mpg?.city     ?? null,
      mpgHighway:  mpg?.highway  ?? null,
      mpgCombined: mpg?.combined ?? null,
      // label is the human-readable string shown in FriendsPanel and the driver picker
      label: `${year} ${make} ${model}`,
    } : null

    // saveProfile() is from AuthContext.jsx — it calls updateUserProfile() in
    // firebase/db.js with { merge: true } so only car and payment are updated,
    // leaving uid, email, and friends untouched.
    await saveProfile({ car: carData, payment })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)   // flash "Saved!" for 2 seconds then revert
  }

  // Sign out via firebase/auth.js signOutUser(), which calls Firebase's signOut().
  // AuthContext.jsx's onAuthStateChanged listener fires with null, clearing
  // currentUser and userProfile across the whole app.
  async function handleSignOut() {
    await signOutUser()
    onClose()   // close the modal after signing out
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* modal-box--wide uses a wider max-width CSS variant for this modal */}
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* ── User info row ───────────────────────────────────────────────── */}
        <div className="profile-user-row">
          {/* Show profile photo if the OAuth provider supplied one, else
              fall back to an initial letter in a circle */}
          {currentUser?.photoURL
            ? <img className="profile-avatar" src={currentUser.photoURL} alt="" />
            : <div className="profile-avatar profile-avatar--initial">
                {(currentUser?.displayName || 'U')[0].toUpperCase()}
              </div>
          }
          <div>
            <p className="profile-name">{currentUser?.displayName || 'User'}</p>
            <p className="profile-email">{currentUser?.email}</p>
          </div>
        </div>

        <hr className="modal-divider" />

        {/* ── Car section — same cascade as App.jsx's "The Car (Mileage)" card ── */}
        <p className="modal-section-label">Your Car</p>
        <div className="car-grid">
          <div className="field">
            <label>Year</label>
            {/* Native <select> instead of App.jsx's custom Combobox — the Profile
                modal doesn't need typeahead since it's a one-time save, not
                a live calculation. */}
            <select value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Make</label>
            <select value={make} onChange={e => setMake(e.target.value)} disabled={!year || loadingMakes}>
              <option value="">{loadingMakes ? 'Loading…' : 'Make'}</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} disabled={!make || loadingModels}>
              <option value="">{loadingModels ? 'Loading…' : 'Model'}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Only show trim picker when there are multiple variants — same condition as App.jsx */}
        {options.length > 1 && (
          <div className="field" style={{ marginTop: 10 }}>
            <label>Trim / Engine</label>
            <select value={trimId} onChange={e => setTrimId(e.target.value)}>
              <option value="">Select trim…</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
            </select>
          </div>
        )}

        {loadingMpg && <p className="loading-text">Fetching MPG…</p>}

        {/* MPG badge — only shown after a successful getVehicleMPG() call.
            The ?? operator returns the right side when the left side is null/undefined. */}
        {mpg && !loadingMpg && (
          <div className="profile-mpg-badge">
            <span className="mpg-number">{mpg.combined ?? '–'}</span>
            <span className="mpg-label">MPG combined</span>
            <span className="profile-mpg-sub">city {mpg.city ?? '–'} · hwy {mpg.highway ?? '–'}</span>
          </div>
        )}

        <hr className="modal-divider" />

        {/* ── Payment section ─────────────────────────────────────────────── */}
        {/* These handles are read by App.jsx's "driver picker" section when a friend
            is selected, and by PaymentButtons.jsx to build deep links to payment apps. */}
        <p className="modal-section-label">Your Payment Handles</p>
        <p className="modal-section-hint">Friends will see these when they split gas with you as the driver.</p>
        <div className="payment-handles">
          {/* Render one input row per PAYMENT_FIELDS entry.
              [f.id] is computed property syntax: equivalent to payment['venmoHandle'] etc.
              The spread { ...p, [f.id]: e.target.value } copies all existing payment
              fields and overwrites only the one being typed into. */}
          {PAYMENT_FIELDS.map(f => (
            <div className="field" key={f.id}>
              <label>{f.label}</label>
              <div className="handle-input-row">
                {/* Only render the prefix span when there is one ('@' or '$').
                    The CSS rounds only the right side of the input when a prefix is present. */}
                {f.prefix && (
                  <span className={`handle-prefix ${f.id === 'venmoHandle' ? 'venmo-prefix' : f.id === 'cashAppHandle' ? 'cashapp-prefix' : ''}`}>
                    {f.prefix}
                  </span>
                )}
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={payment[f.id]}
                  style={{ borderRadius: f.prefix ? '0 8px 8px 0' : '8px' }}
                  onChange={e => setPayment(p => ({ ...p, [f.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          {/* Button label cycles through three states: default → saving → saved */}
          <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
          </button>
          <button className="modal-signout-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  )
}
