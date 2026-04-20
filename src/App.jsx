// App.jsx
// The root component of Split Tank. This single file contains all the
// main application logic and renders the full page layout.
//
// REACT FUNDAMENTALS PRESENT IN THIS FILE:
//   useState   — stores a piece of data that, when changed, re-renders the UI
//   useEffect  — runs side-effects (API calls, subscriptions) after renders
//   useRef     — holds a mutable value that does NOT trigger re-renders
//   Conditional rendering — {condition && <Component />} renders only if true
//   Computed values — const x = someCalc() computed fresh on every render

import { useState, useEffect, useRef } from 'react'
import { getYears, getMakes, getModels, getOptions, getVehicleMPG } from './api/fuelEconomy'
import { STATE_GAS_PRICES } from './data/gasPrices'
import { fetchStateGasPrice, normalizeCounty } from './api/gasPrice'
import { fetchCounties } from './api/counties'
import RoadHero from './components/RoadHero'
import RoadGallery from './components/RoadGallery'
import PaymentButtons from './components/PaymentButtons'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import FriendsPanel from './components/FriendsPanel'
import { useAuth } from './contexts/AuthContext'
import './App.css'

export default function App() {

  // ── Trip state ────────────────────────────────────────────────────────────
  // Each useState call creates [value, setter]. React re-renders the component
  // whenever a setter is called with a new value.
  const [miles,         setMiles]         = useState('')    // miles driven
  const [state,         setState]         = useState('')    // US state name
  const [gasPrice,      setGasPrice]      = useState('')    // $/gallon
  const [customGas,     setCustomGas]     = useState(false) // true if user manually typed a price
  const [livePriceDate, setLivePriceDate] = useState(null)  // "Apr 14" — when EIA data was published
  const [livePriceLabel,setLivePriceLabel]= useState(null)  // "Los Angeles metro" — data source label

  // ── Car state (cascading dropdowns) ──────────────────────────────────────
  // Loading these in sequence: year → makes → models → options → MPG.
  // Each step only runs after the previous one completes.
  const [years,         setYears]         = useState([])
  const [year,          setYear]          = useState('')
  const [makes,         setMakes]         = useState([])
  const [loadingMakes,  setLoadingMakes]  = useState(false)
  const [make,          setMake]          = useState('')
  const [models,        setModels]        = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [model,         setModel]         = useState('')
  const [options,       setOptions]       = useState([])    // trim/engine variants
  const [optionId,      setOptionId]      = useState('')    // selected trim's numeric ID
  const [mpgData,       setMpgData]       = useState(null)  // { city, highway, combined }
  const [mpgType,       setMpgType]       = useState('combined') // which MPG tab is active
  const [loadingMpg,    setLoadingMpg]    = useState(false)
  const [carError,      setCarError]      = useState('')

  // Manual MPG override (user types their own MPG instead of using the lookup)
  const [showManual,    setShowManual]    = useState(false)
  const [manualMpg,     setManualMpg]    = useState('')

  // ── Crew state ────────────────────────────────────────────────────────────
  const [passengers,    setPassengers]   = useState(1)       // number of passengers (not driver)
  const [splitMode,     setSplitMode]    = useState('even')  // 'even' or 'cover'

  // ── Driver payment handles ────────────────────────────────────────────────
  // Optional — filled in so passengers get a direct pay link
  const [venmoHandle,    setVenmoHandle]    = useState('')
  const [cashAppHandle,  setCashAppHandle]  = useState('')
  const [zelleContact,   setZelleContact]   = useState('')
  const [appleContact,   setAppleContact]   = useState('')

  // ── County state ──────────────────────────────────────────────────────────
  const [county,         setCounty]         = useState('')   // selected county name
  const [counties,       setCounties]       = useState([])   // list of all counties for the state
  const [loadingCounties,setLoadingCounties]= useState(false)

  // ── Geolocation state ─────────────────────────────────────────────────────
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [detectedLocation,  setDetectedLocation]  = useState(null) // { city, county, state }
  const [locationError,     setLocationError]     = useState(null)
  const [showManualState,   setShowManualState]   = useState(false)

  // ── Auth + modal state ────────────────────────────────────────────────────
  // useAuth() reads from AuthContext — the sign-in state managed in AuthContext.jsx
  const { currentUser, userProfile, friends, isEnabled } = useAuth()
  const [showAuth,    setShowAuth]    = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)

  // useRef stores a reference to the dropdown DOM element.
  // Unlike useState, changing a ref does NOT trigger a re-render.
  // We use it here to detect clicks outside the menu.
  const menuRef   = useRef(null)
  const resultRef = useRef(null)   // ref to the result card for auto-scroll

  // Selected friend as driver (pre-fills car + payment handles)
  const [driverFriend, setDriverFriend] = useState(null)

  // ── Side effects ──────────────────────────────────────────────────────────

  // Close the header dropdown menu when the user clicks anywhere outside it.
  // useEffect with [] runs ONCE after the first render (like componentDidMount).
  // The returned function is a "cleanup" — it runs when the component unmounts
  // to prevent memory leaks from lingering event listeners.
  useEffect(() => {
    function handleClick(e) {
      // menuRef.current.contains(e.target) checks if the click was INSIDE the menu
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Pre-fill car and payment info from a friend's saved profile.
  function applyDriverFriend(friend) {
    setDriverFriend(friend)
    if (friend.car) {
      // Build an mpgData object from the friend's saved car data
      setMpgData({
        city:     friend.car.mpgCity     ?? null,
        highway:  friend.car.mpgHighway  ?? null,
        combined: friend.car.mpgCombined ?? null,
      })
      setShowManual(false)
      setManualMpg('')
    }
    // Pre-fill all payment handles from their profile
    setVenmoHandle(friend.payment?.venmoHandle   || '')
    setCashAppHandle(friend.payment?.cashAppHandle || '')
    setZelleContact(friend.payment?.zelleContact   || '')
    setAppleContact(friend.payment?.appleContact   || '')
  }

  // Clear the friend driver selection and reset car/payment fields
  function clearDriverFriend() {
    setDriverFriend(null)
    setMpgData(null)
    setYear(''); setMake(''); setModel('')
    setVenmoHandle(''); setCashAppHandle('')
    setZelleContact(''); setAppleContact('')
  }

  // Convert an EIA period string like "2026-04-14" into a readable "Apr 14"
  function formatEIADate(period) {
    if (!period) return null
    const [y, m, d] = period.split('-').map(Number)
    // new Date(year, month-1, day): month is 0-indexed in JS (January = 0)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Reload the county list whenever the selected state changes.
  // The dependency array [state] means this effect re-runs each time `state` changes.
  useEffect(() => {
    setCounty('')    // clear the previously selected county
    setCounties([])
    if (!state) return
    setLoadingCounties(true)
    fetchCounties(state)
      .then(list => { setCounties(list); setLoadingCounties(false) })
      .catch(() => setLoadingCounties(false))
  }, [state])

  // After counties load, auto-select the county that GPS detected.
  // normalizeCounty strips "County" suffix so "Harris County" matches "harris".
  useEffect(() => {
    if (!detectedLocation?.county || counties.length === 0 || county) return
    const detected = normalizeCounty(detectedLocation.county)
    const match = counties.find(c => normalizeCounty(c) === detected)
    if (match) setCounty(match)
  }, [counties, detectedLocation])

  // Use the browser's Geolocation API to detect the user's location.
  // On iOS/Android, this prompts "Allow location access?".
  // We then reverse-geocode the coordinates to a state/county/city name
  // using the free Nominatim API from OpenStreetMap.
  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.')
      return
    }
    setDetectingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {  // success callback — receives { latitude, longitude }
        try {
          // Reverse geocoding: converts coordinates → human-readable address
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const stateName = addr.state
          const county = addr.county || addr.city_district || null
          const city = addr.city || addr.town || addr.village || null

          if (stateName && STATE_GAS_PRICES[stateName]) {
            setState(stateName)
            setDetectedLocation({ city, county, state: stateName })
            setShowManualState(false)
          } else {
            setLocationError('Could not determine your state. Select manually below.')
            setShowManualState(true)
          }
        } catch {
          setLocationError('Location lookup failed. Select your state manually.')
          setShowManualState(true)
        }
        setDetectingLocation(false)
      },
      (err) => {  // error callback — called if user denies permission
        setDetectingLocation(false)
        if (err.code === 1) {
          setLocationError('Location access denied. Select your state manually.')
        } else {
          setLocationError('Could not get location. Select your state manually.')
        }
        setShowManualState(true)
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  // Load the list of model years when the app first loads.
  // No dependency array items = only runs once on mount.
  useEffect(() => {
    getYears()
      .then(setYears)
      .catch(() => setCarError('Could not load vehicle data. Enter MPG manually below.'))
  }, [])

  // When the user picks a year, clear downstream selections and load makes.
  // [year] = this effect re-runs only when `year` changes.
  useEffect(() => {
    if (!year) return
    setMake(''); setMakes([]); setModel(''); setModels([])
    setOptions([]); setOptionId(''); setMpgData(null); setCarError('')
    setLoadingMakes(true)
    getMakes(year)
      .then(setMakes)
      .catch(() => setCarError('Could not load makes.'))
      .finally(() => setLoadingMakes(false))
  }, [year])

  // When the user picks a make, clear downstream selections and load models.
  useEffect(() => {
    if (!make) return
    setModel(''); setModels([]); setOptions([]); setOptionId(''); setMpgData(null); setCarError('')
    setLoadingModels(true)
    getModels(year, make)
      .then(setModels)
      .catch(() => setCarError('Could not load models.'))
      .finally(() => setLoadingModels(false))
  }, [make])

  // When the user picks a model, load the trim/engine options.
  // If there's only one option, auto-select it (no need to show a dropdown).
  useEffect(() => {
    if (!model) return
    setOptions([]); setOptionId(''); setMpgData(null); setCarError('')
    setLoadingMpg(true)
    getOptions(year, make, model)
      .then(opts => {
        setOptions(opts)
        if (opts.length === 1) setOptionId(opts[0].value)  // auto-select if only one trim
        else setLoadingMpg(false)
      })
      .catch(() => {
        setCarError('Could not load trims.')
        setLoadingMpg(false)
      })
  }, [model])

  // When a specific trim option is selected (or auto-selected), fetch its MPG.
  useEffect(() => {
    if (!optionId) return
    setLoadingMpg(true)
    getVehicleMPG(optionId)
      .then(data => {
        setMpgData(data)
        if (!data.combined && !data.city && !data.highway) {
          setCarError('No MPG data for this vehicle. Enter it manually.')
        }
      })
      .catch(() => setCarError('Could not load MPG. Enter it manually.'))
      .finally(() => setLoadingMpg(false))
  }, [optionId])

  // Fetch the live gas price whenever state or county changes.
  // Only runs if the user hasn't manually overridden the price (customGas flag).
  // Falls back to the static STATE_GAS_PRICES table if the API returns nothing.
  useEffect(() => {
    if (!state || customGas) return
    setLivePriceDate(null)
    setLivePriceLabel(null)
    fetchStateGasPrice(state, county || null).then(result => {
      if (result) {
        setGasPrice(result.price.toFixed(2))        // e.g. "3.45"
        setLivePriceDate(formatEIADate(result.period))
        setLivePriceLabel(result.label ?? null)
      } else {
        // API unavailable — use the hardcoded state average
        setGasPrice(STATE_GAS_PRICES[state]?.toFixed(2) ?? '')
      }
    })
  }, [state, county])

  // ── Computed values ───────────────────────────────────────────────────────
  // These are recalculated on every render. No state needed since they depend
  // entirely on state values already tracked above.

  // Return the active MPG value based on whether manual mode is on and which tab
  const activeMpg = () => {
    if (showManual && manualMpg) return parseFloat(manualMpg)
    if (!mpgData) return null
    return mpgData[mpgType] ?? null   // mpgType is 'city', 'highway', or 'combined'
  }

  // The main calculation — returns null if any required input is missing.
  // This is an IIFE (Immediately Invoked Function Expression): (() => { ... })()
  // It runs immediately and its return value becomes liveResult.
  const liveResult = (() => {
    const m   = parseFloat(miles)
    const gp  = parseFloat(gasPrice)
    const mpg = activeMpg()
    if (!m || !gp || !mpg) return null   // missing inputs — show placeholder

    const gallons   = m / mpg
    const totalCost = gallons * gp
    const perPerson = splitMode === 'even'
      ? totalCost / (passengers + 1)   // driver + all passengers share equally
      : totalCost / passengers          // passengers cover the full cost between them

    return { gallons, totalCost, perPerson, passengers, splitMode, miles: m, mpg, gp }
  })()

  // Scroll the result card into view the first time a result appears.
  useEffect(() => {
    if (liveResult) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [liveResult !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── JSX ───────────────────────────────────────────────────────────────────
  // JSX looks like HTML but is actually JavaScript. Each tag is a function call.
  // className is used instead of class (class is a reserved JS keyword).
  // {expression} inside JSX evaluates JavaScript and renders the result.

  return (
    <div className="app">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1>Split Tank</h1>
            <p>Figure out what everyone owes</p>
          </div>

          {/* Auth controls — only rendered if Firebase is configured (isEnabled) */}
          {isEnabled && (
            <div className="header-auth" ref={menuRef}>
              {currentUser ? (
                <>
                  {/* User is signed in: show avatar + name button that opens a dropdown */}
                  <button className="user-menu-btn" onClick={() => setMenuOpen(o => !o)}>
                    {currentUser.photoURL
                      ? <img src={currentUser.photoURL} alt="" className="user-avatar-img" />
                      : <span className="user-avatar-initial">
                          {(currentUser.displayName || 'U')[0].toUpperCase()}
                        </span>
                    }
                    <span className="user-display-name">
                      {currentUser.displayName?.split(' ')[0] || 'Account'}
                    </span>
                    {/* ▲ / ▼ chevron changes based on whether menu is open */}
                    <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Dropdown menu — only rendered when menuOpen is true */}
                  {menuOpen && (
                    <div className="user-dropdown">
                      <button onClick={() => { setShowProfile(true); setMenuOpen(false) }}>
                        My Profile &amp; Car
                      </button>
                      <button onClick={() => { setShowFriends(true); setMenuOpen(false) }}>
                        Friends ({friends.length})
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // User is signed out: show sign-in button
                <button className="sign-in-btn" onClick={() => setShowAuth(true)}>
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Decorative road scene banner */}
      <RoadHero />

      <main className="app-main">

        {/* ── FRIEND DRIVER PICKER ─────────────────────────────────────────
            Only shown when the user is logged in AND has at least one friend.
            && short-circuits: if the left side is false, the right side never renders. */}
        {isEnabled && currentUser && friends.length > 0 && (
          <section className="card driver-picker-card">
            <span className="section-title">Who's driving?</span>
            <p className="driver-picker-hint">
              Select a friend to auto-fill their car and payment info.
            </p>
            <div className="driver-friend-list">
              {friends.map(f => (
                <button
                  key={f.id}
                  className={`driver-friend-btn${driverFriend?.id === f.id ? ' selected' : ''}`}
                  onClick={() => driverFriend?.id === f.id ? clearDriverFriend() : applyDriverFriend(f)}
                  disabled={!f.car}   // can't select a friend with no car saved
                  title={!f.car ? `${f.displayName} hasn't saved their car yet` : ''}
                >
                  <span className="driver-friend-name">{f.displayName}</span>
                  {f.car
                    ? <span className="driver-friend-car">{f.car.label} · {f.car.mpgCombined} mpg</span>
                    : <span className="driver-friend-car muted">No car saved</span>
                  }
                </button>
              ))}
            </div>
            {driverFriend && (
              <button className="clear-driver-btn" onClick={clearDriverFriend}>
                Clear — enter car manually
              </button>
            )}
          </section>
        )}

        {/* ── TRIP DETAILS ──────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">Trip Details</span>

          {/* Miles input */}
          <div className="field">
            <label>Miles driven</label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={miles}
              onChange={e => setMiles(e.target.value)}
              min="0"
            />
          </div>

          {/* Location detection */}
          <div className="field">
            <label>Your location</label>

            {/* If location was already detected, show a chip instead of the button */}
            {detectedLocation ? (
              <div className="location-chip">
                <span className="location-chip-icon">📍</span>
                <span className="location-chip-text">
                  {/* .filter(Boolean) removes falsy values (null, undefined, '') before joining */}
                  {[detectedLocation.city, detectedLocation.county, detectedLocation.state]
                    .filter(Boolean).join(' · ')}
                </span>
                <button
                  type="button"
                  className="location-chip-change"
                  onClick={() => { setDetectedLocation(null); setShowManualState(true) }}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="use-location-btn"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                >
                  {detectingLocation
                    ? <><span className="location-spinner" /> Detecting your location…</>
                    : <><span className="location-pin-icon">📍</span> Use My Location</>
                  }
                </button>
                {locationError && <p className="location-error">{locationError}</p>}

                {/* Show the manual state dropdown only if location failed or user chose it */}
                {showManualState ? (
                  <div className="manual-state-row">
                    <select value={state} onChange={e => setState(e.target.value)}>
                      <option value="">Select a state...</option>
                      {/* Object.keys() gives us the state names; .sort() alphabetizes them */}
                      {Object.keys(STATE_GAS_PRICES).sort().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button type="button" className="enter-manually-link" onClick={() => setShowManualState(true)}>
                    Enter state manually instead
                  </button>
                )}
              </>
            )}
          </div>

          {/* County dropdown — only appears after a state is selected.
              The county-field class triggers the slide-in animation. */}
          {state && (
            <div className="field county-field">
              <label>County</label>
              <select
                value={county}
                onChange={e => setCounty(e.target.value)}
                disabled={loadingCounties}
              >
                <option value="">
                  {loadingCounties ? 'Loading…' : 'All counties (state average)'}
                </option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* Show which metro area data source is being used */}
              {county && livePriceLabel && (
                <p className="county-note">📍 Using {livePriceLabel} prices</p>
              )}
            </div>
          )}

          {/* Gas price input with live/static badge */}
          <div className="field">
            <label>
              Gas price ($/gal)
              {/* Badge shows whether we have live EIA data or are using a state average */}
              {state && !customGas && (
                <span className="badge">
                  {livePriceDate
                    ? `Live · ${livePriceDate}${livePriceLabel ? ` · ${livePriceLabel}` : ''}`
                    : 'State avg'}
                </span>
              )}
            </label>

            {/* Hint shown when county is set but no metro-level data is available */}
            {(county || detectedLocation?.county) && !customGas && !livePriceLabel && (
              <p className="county-note">
                📍 {county || detectedLocation.county} — using {state} weekly average.
                Tap the price to enter your local pump price.
              </p>
            )}

            <div className="gas-price-row">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 3.45"
                value={gasPrice}
                // Setting customGas to true locks in the user's manual price
                // and prevents the auto-fill effect from overwriting it
                onChange={e => { setGasPrice(e.target.value); setCustomGas(true) }}
                min="0"
              />
              {/* "Reset to avg" button only appears after the user has customized the price */}
              {customGas && state && (
                <button className="reset-btn" onClick={() => {
                  setCustomGas(false)
                  setLivePriceDate(null)
                  setLivePriceLabel(null)
                  // Re-run the gas price fetch (same logic as the effect above)
                  fetchStateGasPrice(state, county || null).then(result => {
                    if (result) {
                      setGasPrice(result.price.toFixed(2))
                      setLivePriceDate(formatEIADate(result.period))
                      setLivePriceLabel(result.label ?? null)
                    } else {
                      setGasPrice(STATE_GAS_PRICES[state]?.toFixed(2) ?? '')
                    }
                  })
                }}>
                  Reset to avg
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── THE CAR ───────────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">The Car</span>

          {/* If a friend is pre-selected as driver, show their car as a summary */}
          {driverFriend?.car && (
            <div className="friend-car-badge">
              <span className="friend-car-badge-name">{driverFriend.displayName}'s car</span>
              <span className="friend-car-badge-label">{driverFriend.car.label}</span>
            </div>
          )}

          {/* Vehicle lookup dropdowns — hidden when a friend driver is selected */}
          {!driverFriend && <div className="car-grid">
            <div className="field">
              <label>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Make</label>
              {/* disabled until year is selected; shows "Loading..." while fetching */}
              <select
                value={make}
                onChange={e => setMake(e.target.value)}
                disabled={!year || loadingMakes}
              >
                <option value="">{loadingMakes ? 'Loading...' : 'Make'}</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={!make || loadingModels}
              >
                <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>}

          {/* Trim picker — only shown when a model has multiple trims */}
          {!driverFriend && options.length > 1 && (
            <div className="field">
              <label>Trim / Engine</label>
              <select value={optionId} onChange={e => setOptionId(e.target.value)}>
                <option value="">Select trim...</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
              </select>
            </div>
          )}

          {!driverFriend && loadingMpg && <p className="loading-text">Loading vehicle data...</p>}
          {!driverFriend && carError && !loadingMpg && <p className="car-error">{carError}</p>}

          {/* MPG display with city/combined/highway tabs */}
          {mpgData && !loadingMpg && !showManual && (
            <div className="mpg-display">
              <div className="mpg-tabs">
                {['city', 'combined', 'highway'].map(t => (
                  <button
                    key={t}
                    // Template literal adds the 'active' class conditionally
                    className={`mpg-tab${mpgType === t ? ' active' : ''}`}
                    onClick={() => setMpgType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}  {/* capitalize first letter */}
                  </button>
                ))}
              </div>
              <div className="mpg-value">
                <span className="mpg-number">{mpgData[mpgType] ?? '--'}</span>
                <span className="mpg-label">MPG</span>
              </div>
            </div>
          )}

          {/* Manual MPG entry — toggle between vehicle lookup and manual input */}
          <div className="manual-mpg-toggle">
            {!showManual ? (
              <button onClick={() => setShowManual(true)}>
                Enter MPG manually instead
              </button>
            ) : (
              <>
                <div className="manual-mpg-row">
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={manualMpg}
                    onChange={e => setManualMpg(e.target.value)}
                    min="1"
                  />
                  <span>MPG</span>
                </div>
                {mpgData && (
                  <button onClick={() => { setShowManual(false); setManualMpg('') }}>
                    Use vehicle lookup instead
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── THE TOTAL ─────────────────────────────────────────────────────── */}
        {/* ref={resultRef} attaches a DOM reference so we can scrollIntoView it */}
        <section className="card result-card" ref={resultRef}>
          <span className="section-title">The Total</span>

          {/* Passenger counter */}
          <div className="field">
            <label>Passengers (not counting the driver)</label>
            <div className="counter-row">
              {/* Math.max(1, p - 1) prevents going below 1 passenger */}
              <button
                className="counter-btn"
                onClick={() => setPassengers(p => Math.max(1, p - 1))}
                disabled={passengers <= 1}
              >
                −
              </button>
              <span className="counter-val">{passengers}</span>
              <button
                className="counter-btn"
                onClick={() => setPassengers(p => p + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Split mode radio buttons */}
          <div className="field">
            <label>How should gas be split?</label>
            <div className="split-options">
              {/* Each <label> wraps its <input> so clicking the text also selects it */}
              <label className={`split-option${splitMode === 'even' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="split"
                  checked={splitMode === 'even'}
                  onChange={() => setSplitMode('even')}
                />
                <div className="split-option-text">
                  <strong>Split evenly</strong>
                  <p>Everyone including the driver pays an equal share</p>
                </div>
              </label>
              <label className={`split-option${splitMode === 'cover' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="split"
                  checked={splitMode === 'cover'}
                  onChange={() => setSplitMode('cover')}
                />
                <div className="split-option-text">
                  <strong>Passengers cover the driver</strong>
                  <p>Passengers split the full gas cost between themselves</p>
                </div>
              </label>
            </div>
          </div>

          {/* Show results if all inputs are filled, otherwise show placeholder */}
          {liveResult ? (
            <>
              {/* Stats grid: 4 summary numbers */}
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Gas used</span>
                  <span className="stat-value">{liveResult.gallons.toFixed(2)} gal</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total gas cost</span>
                  <span className="stat-value">${liveResult.totalCost.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">MPG used</span>
                  <span className="stat-value">{liveResult.mpg} mpg</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Price per gallon</span>
                  <span className="stat-value">${liveResult.gp.toFixed(2)}</span>
                </div>
              </div>

              {/* Big per-person number — the main result */}
              <div className="per-person-box">
                <span className="per-person-label">Each passenger owes</span>
                <span className="per-person-amount">${liveResult.perPerson.toFixed(2)}</span>
                <p className="per-person-note">
                  {liveResult.splitMode === 'even'
                    ? `${liveResult.passengers + 1} people splitting evenly`
                    : `${liveResult.passengers} passenger${liveResult.passengers > 1 ? 's' : ''} covering the driver`
                  }
                </p>
              </div>

              {/* Native share button — only available on iOS Safari and Android Chrome.
                  navigator.share is undefined on desktop browsers, so we check first. */}
              {navigator.share && (
                <button
                  className="share-btn"
                  onClick={() => navigator.share({
                    title: 'Split Tank',
                    text: `Gas split: each person owes $${liveResult.perPerson.toFixed(2)} for a ${Math.round(liveResult.miles)}-mile trip`,
                    url: 'https://splittank.com',
                  }).catch(() => {})}  // .catch ignores the AbortError if user cancels
                >
                  📤 Share result
                </button>
              )}
            </>
          ) : (
            <p className="total-placeholder">
              Fill in trip details and car info above to see the total.
            </p>
          )}
        </section>

        {/* ── PAYMENT INFO ─────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">Driver payment info</span>
          {driverFriend
            ? <p className="payment-info-hint">
                Pre-filled from {driverFriend.displayName}'s profile. You can still edit below.
              </p>
            : <p className="payment-info-hint">
                Optional — fill in the driver's handles so passengers get a direct pay link.
                {isEnabled && !currentUser && (
                  <> <button className="inline-link" onClick={() => setShowAuth(true)}>Sign in</button> to save yours.</>
                )}
              </p>
          }

          {/* Payment handle inputs in a 2-column grid */}
          <div className="payment-handles">
            <div className="field">
              <label>Venmo username</label>
              <div className="handle-input-row">
                <span className="handle-prefix venmo-prefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={venmoHandle}
                  // .replace(/^@/, '') strips a leading @ if the user types one
                  onChange={e => setVenmoHandle(e.target.value.replace(/^@/, ''))}
                />
              </div>
            </div>
            <div className="field">
              <label>Cash App $cashtag</label>
              <div className="handle-input-row">
                <span className="handle-prefix cashapp-prefix">$</span>
                <input
                  type="text"
                  placeholder="cashtag"
                  value={cashAppHandle}
                  onChange={e => setCashAppHandle(e.target.value.replace(/^\$/, ''))}
                />
              </div>
            </div>
            <div className="field">
              <label>Zelle</label>
              <input
                type="text"
                placeholder="phone or email"
                value={zelleContact}
                onChange={e => setZelleContact(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Apple Pay</label>
              <input
                type="text"
                placeholder="phone number"
                value={appleContact}
                onChange={e => setAppleContact(e.target.value)}
              />
            </div>
          </div>

          {/* PaymentButtons only renders when there's a result to pay for */}
          {liveResult && (
            <PaymentButtons
              amount={liveResult.perPerson.toFixed(2)}
              venmoHandle={venmoHandle}
              cashAppHandle={cashAppHandle}
              zelleContact={zelleContact}
              appleContact={appleContact}
            />
          )}
        </section>
      </main>

      {/* Decorative bottom gallery panels */}
      <RoadGallery />

      <footer className="app-footer">
        Gas prices are fetched live from EIA weekly data — every Monday.
      </footer>

      {/* Modals — each renders as an overlay on top of the page.
          They're kept at the bottom so they're outside the main layout flow. */}
      {showAuth    && <AuthModal    onClose={() => setShowAuth(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showFriends && (
        <FriendsPanel
          onSelectDriver={applyDriverFriend}
          onClose={() => setShowFriends(false)}
        />
      )}
    </div>
  )
}
