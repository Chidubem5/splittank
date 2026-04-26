import { useState, useEffect, useRef } from 'react'
import { getYears, getMakes, getModels, getOptions, getVehicleMPG } from './api/fuelEconomy'
import { STATE_GAS_PRICES } from './data/gasPrices'
import { fetchStateGasPrice, normalizeCounty, METRO_STATES } from './api/gasPrice'
import { fetchCounties } from './api/counties'
import Combobox from './components/Combobox'
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
  const [optionText,    setOptionText]    = useState('')    // display text for typeable trim field
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

  // ── Driver payment handles (arrays to support multiple contacts per method) ─
  const [venmoHandles,   setVenmoHandles]   = useState([''])
  const [cashAppHandles, setCashAppHandles] = useState([''])
  const [zelleContacts,  setZelleContacts]  = useState([''])
  const [appleContacts,  setAppleContacts]  = useState([''])

  // ── Passenger contacts (for sending payment requests via SMS) ─────────────
  const [passengerContacts, setPassengerContacts] = useState([])

  // ── Tolls ─────────────────────────────────────────────────────────────────
  const [tolls, setTolls] = useState('')

  // ── Route / address lookup ────────────────────────────────────────────────
  const [tripFrom,     setTripFrom]     = useState('')
  const [tripTo,       setTripTo]       = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError,   setRouteError]   = useState('')
  const [cityRatio,    setCityRatio]    = useState(null) // 0–1 fraction that is city driving; null = not calculated
  const [showRoute,    setShowRoute]    = useState(false)

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

  // Close the header dropdown on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Pre-fill car and payment info from a friend's saved profile.
  function applyDriverFriend(friend) {
    setDriverFriend(friend)
    if (friend.car) {
      setMpgData({
        city:     friend.car.mpgCity     ?? null,
        highway:  friend.car.mpgHighway  ?? null,
        combined: friend.car.mpgCombined ?? null,
      })
      setShowManual(false)
      setManualMpg('')
    }
    // Pre-fill all payment handles from their profile
    setVenmoHandles([friend.payment?.venmoHandle   || ''])
    setCashAppHandles([friend.payment?.cashAppHandle || ''])
    setZelleContacts([friend.payment?.zelleContact   || ''])
    setAppleContacts([friend.payment?.appleContact   || ''])
  }

  // Clear the friend driver selection and reset car/payment fields
  function clearDriverFriend() {
    setDriverFriend(null)
    setMpgData(null)
    setYear(''); setMake(''); setModel('')
    setVenmoHandles(['']); setCashAppHandles([''])
    setZelleContacts(['']); setAppleContacts([''])
  }

  // ── Contact array helpers ─────────────────────────────────────────────────
  function addContact(setter)         { setter(prev => [...prev, '']) }
  function removeContact(setter, idx) { setter(prev => prev.filter((_, i) => i !== idx)) }
  function updateContact(setter, idx, val) {
    setter(prev => prev.map((v, i) => i === idx ? val : v))
  }

  // ── Route calculator ──────────────────────────────────────────────────────

  // Tries Nominatim first (good for street addresses), then falls back to
  // Photon (komoot.io) which handles venue names, landmarks, and POIs well.
  async function geocode(query) {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data?.[0]) return { lat: data[0].lat, lon: data[0].lon }
    } catch {}

    try {
      const res    = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`
      )
      const data   = await res.json()
      const coords = data?.features?.[0]?.geometry?.coordinates
      if (coords) return { lat: String(coords[1]), lon: String(coords[0]) }
    } catch {}

    return null
  }

  async function fetchRoute() {
    if (!tripFrom.trim() || !tripTo.trim()) return
    setRouteLoading(true)
    setRouteError('')
    setCityRatio(null)
    try {
      const [from, to] = await Promise.all([geocode(tripFrom), geocode(tripTo)])
      if (!from || !to) {
        setRouteError("Couldn't find one or both locations. Try adding a city or state, or use a well-known landmark name.")
        return
      }
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&annotations=speed,distance`
      )
      const routeData = await routeRes.json()
      if (routeData.code !== 'Ok' || !routeData.routes?.[0]) {
        setRouteError("Couldn't find a driving route between those addresses.")
        return
      }
      const route = routeData.routes[0]
      setMiles((route.distance / 1609.34).toFixed(1))
      // Calculate city/highway split: segments with speed > 22 m/s (~50 mph) = highway
      let hwyMeters = 0, totalMeters = 0
      route.legs.forEach(leg => {
        const ann = leg.annotation
        if (!ann?.speed || !ann?.distance) return
        ann.speed.forEach((s, i) => {
          const d = ann.distance[i] ?? 0
          totalMeters += d
          if (s > 22) hwyMeters += d
        })
      })
      if (totalMeters > 0) setCityRatio(1 - hwyMeters / totalMeters)
    } catch {
      setRouteError('Route lookup failed. Try entering miles manually.')
    } finally {
      setRouteLoading(false)
    }
  }

  // ── Sync contacts (Web Contact Picker API — iOS/Android only) ────────────
  async function syncContacts() {
    if (!navigator.contacts?.select) {
      alert('Contact picker works on iOS Safari 14.5+ and Android Chrome. Enter contacts manually above.')
      return
    }
    try {
      const picked = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true })
      if (!picked?.length) return
      const phones = [...new Set(picked.flatMap(c => (c.tel  || []).map(t => t.trim()).filter(Boolean)))]
      const emails = [...new Set(picked.flatMap(c => (c.email || []).map(e => e.trim()).filter(Boolean)))]
      if (phones.length || emails.length) {
        setZelleContacts([...phones, ...emails])
        if (phones.length) setAppleContacts(phones)
      }
      setPassengerContacts(picked.map(c => ({ name: c.name?.[0] || 'Passenger', tel: c.tel?.[0] || null })))
    } catch { /* user cancelled */ }
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

  // Load the list of model years once on mount.
  useEffect(() => {
    getYears()
      .then(setYears)
      .catch(() => setCarError('Could not load vehicle data. Enter MPG manually below.'))
  }, [])

  // Year → fetch makes; clear everything downstream.
  useEffect(() => {
    if (!year) return
    setMake(''); setMakes([]); setModel(''); setModels([])
    setOptions([]); setOptionId(''); setOptionText(''); setMpgData(null); setCarError('')
    if (!years.includes(year)) return
    setLoadingMakes(true)
    getMakes(year)
      .then(setMakes)
      .catch(() => setCarError('Could not load makes.'))
      .finally(() => setLoadingMakes(false))
  }, [year, years])

  // Make → fetch models; clear everything downstream.
  useEffect(() => {
    if (!make || !makes.includes(make)) return
    setModel(''); setModels([]); setOptions([]); setOptionId(''); setOptionText(''); setMpgData(null); setCarError('')
    setLoadingModels(true)
    getModels(year, make)
      .then(setModels)
      .catch(() => setCarError('Could not load models.'))
      .finally(() => setLoadingModels(false))
  }, [make, makes])

  // Model → fetch trims; auto-select if only one exists.
  useEffect(() => {
    if (!model || !models.includes(model)) return
    setOptions([]); setOptionId(''); setOptionText(''); setMpgData(null); setCarError('')
    setLoadingMpg(true)
    getOptions(year, make, model)
      .then(opts => {
        setOptions(opts)
        if (opts.length === 1) {
          setOptionId(opts[0].value)
          setOptionText(opts[0].text)
        } else setLoadingMpg(false)
      })
      .catch(() => {
        setCarError('Could not load trims.')
        setLoadingMpg(false)
      })
  }, [model, models])

  // Trim selected → fetch MPG.
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
  const activeMpg = () => {
    if (showManual && manualMpg) return parseFloat(manualMpg)
    if (!mpgData) return null
    return mpgData[mpgType] ?? null   // mpgType is 'city', 'highway', or 'combined'
  }

  const liveResult = (() => {
    const m  = parseFloat(miles)
    const gp = parseFloat(gasPrice)
    if (!m || !gp) return null

    let gallons, mpg

    if (cityRatio !== null && mpgData?.city && mpgData?.highway && !showManual) {
      // City/highway split from route calculation
      const cityM = m * cityRatio
      const hwyM  = m * (1 - cityRatio)
      gallons = cityM / mpgData.city + hwyM / mpgData.highway
      mpg = parseFloat((m / gallons).toFixed(1))
    } else {
      mpg = activeMpg()
      if (!mpg) return null
      gallons = m / mpg
    }

    const tollAmount = parseFloat(tolls) || 0
    const gasCost   = gallons * gp
    const totalCost = gasCost + tollAmount
    const perPerson = splitMode === 'even'
      ? totalCost / (passengers + 1)
      : totalCost / passengers

    return { gallons, gasCost, tollAmount, totalCost, perPerson, passengers, splitMode, miles: m, mpg, gp, cityRatio }
  })()

  // Scroll the result card into view the first time a result appears.
  useEffect(() => {
    if (liveResult) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [liveResult !== null]) // eslint-disable-line react-hooks/exhaustive-deps

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
                    <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
                  </button>

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

          {/* Route calculator — geocodes two addresses and auto-fills miles */}
          <div className="field">
            <label>
              Calculate from addresses
              <button
                type="button"
                className="toggle-link"
                onClick={() => setShowRoute(r => !r)}
              >
                {showRoute ? 'hide' : 'show'}
              </button>
            </label>

            {showRoute && (
              <div className="route-fields">
                <input
                  type="text"
                  placeholder="From — e.g. 123 Main St, Boston MA"
                  value={tripFrom}
                  onChange={e => { setTripFrom(e.target.value); setCityRatio(null) }}
                />
                <input
                  type="text"
                  placeholder="To — e.g. 456 Oak Ave, Providence RI"
                  value={tripTo}
                  onChange={e => { setTripTo(e.target.value); setCityRatio(null) }}
                />
                <button
                  type="button"
                  className="route-btn"
                  onClick={fetchRoute}
                  disabled={routeLoading || !tripFrom.trim() || !tripTo.trim()}
                >
                  {routeLoading ? 'Calculating…' : 'Get Route & Miles'}
                </button>
                {routeError && <p className="route-error">{routeError}</p>}
                {cityRatio !== null && (
                  <p className="route-split">
                    📍 {Math.round((1 - cityRatio) * 100)}% highway · {Math.round(cityRatio * 100)}% city
                    {mpgData?.city && mpgData?.highway && !showManual && ' — using split MPG for accuracy'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Miles input */}
          <div className="field">
            <label>Miles driven</label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={miles}
              onChange={e => { setMiles(e.target.value); setCityRatio(null) }}
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

          {/* County dropdown — only shown for states with metro-level EIA data.
              For all other states every county maps to the same regional average,
              so the dropdown would be decorative noise. */}
          {state && METRO_STATES.has(state) && (
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
          <span className="section-title">The Car (Mileage)</span>

          {/* If a friend is pre-selected as driver, show their car as a summary */}
          {driverFriend?.car && (
            <div className="friend-car-badge">
              <span className="friend-car-badge-name">{driverFriend.displayName}'s car</span>
              <span className="friend-car-badge-label">{driverFriend.car.label}</span>
            </div>
          )}

          {/* Vehicle lookup — typeable comboboxes (type or pick from dropdown) */}
          {!driverFriend && (
            <>
              <div className="car-grid">
                <div className="field">
                  <label>Year</label>
                  <Combobox
                    options={years.map(String)}
                    value={year}
                    onChange={setYear}
                    placeholder="e.g. 2022"
                  />
                </div>

                <div className="field">
                  <label>Make</label>
                  <Combobox
                    options={makes}
                    value={make}
                    onChange={setMake}
                    placeholder={loadingMakes ? 'Loading…' : year ? 'e.g. Toyota' : 'Enter year first'}
                    disabled={!year || loadingMakes}
                  />
                </div>

                <div className="field">
                  <label>Model</label>
                  <Combobox
                    options={models}
                    value={model}
                    onChange={setModel}
                    placeholder={loadingModels ? 'Loading…' : make ? 'e.g. Camry' : 'Enter make first'}
                    disabled={!make || loadingModels}
                  />
                </div>
              </div>

              {/* Trim picker — typeable, only shown when model has multiple trims */}
              {options.length > 1 && (
                <div className="field">
                  <label>Trim / Engine</label>
                  <Combobox
                    options={options.map(o => o.text)}
                    value={optionText}
                    onChange={text => {
                      setOptionText(text)
                      const match = options.find(o => o.text === text)
                      setOptionId(match ? match.value : '')
                    }}
                    placeholder="Type or select trim…"
                  />
                </div>
              )}
            </>
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

        {/* ── TOLLS ────────────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">Tolls</span>
          <p className="payment-info-hint">
            Optional — add any toll costs for this trip. You can look these up in
            Google Maps before you leave.
          </p>
          <div className="field">
            <label>Total tolls ($)</label>
            <input
              type="number"
              step="0.25"
              placeholder="e.g. 8.50"
              value={tolls}
              onChange={e => setTolls(e.target.value)}
              min="0"
            />
          </div>
        </section>

        {/* ── THE TOTAL ─────────────────────────────────────────────────────── */}
        <section className="card result-card" ref={resultRef}>
          <span className="section-title">The Total</span>

          <div className="field">
            <label>Passengers (not counting the driver)</label>
            <div className="counter-row">
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

          <div className="field">
            <label>How should gas be split?</label>
            <div className="split-options">
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
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Gas used</span>
                  <span className="stat-value">{liveResult.gallons.toFixed(2)} gal</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{liveResult.tollAmount > 0 ? 'Gas cost' : 'Total gas cost'}</span>
                  <span className="stat-value">${liveResult.gasCost.toFixed(2)}</span>
                </div>
                {liveResult.tollAmount > 0 && (
                  <div className="stat">
                    <span className="stat-label">Tolls</span>
                    <span className="stat-value">${liveResult.tollAmount.toFixed(2)}</span>
                  </div>
                )}
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

          {/* Payment handle inputs — each method supports multiple contacts */}
          <div className="payment-handles">

            {/* Venmo */}
            <div className="field">
              <label>Venmo username</label>
              {venmoHandles.map((h, i) => (
                <div className="handle-input-row multi-contact-row" key={i}>
                  <span className="handle-prefix venmo-prefix">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={h}
                    onChange={e => updateContact(setVenmoHandles, i, e.target.value.replace(/^@/, ''))}
                  />
                  {venmoHandles.length > 1 && (
                    <button type="button" className="remove-contact-btn" onClick={() => removeContact(setVenmoHandles, i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-contact-btn" onClick={() => addContact(setVenmoHandles)}>+ add</button>
            </div>

            {/* Cash App */}
            <div className="field">
              <label>Cash App $cashtag</label>
              {cashAppHandles.map((h, i) => (
                <div className="handle-input-row multi-contact-row" key={i}>
                  <span className="handle-prefix cashapp-prefix">$</span>
                  <input
                    type="text"
                    placeholder="cashtag"
                    value={h}
                    onChange={e => updateContact(setCashAppHandles, i, e.target.value.replace(/^\$/, ''))}
                  />
                  {cashAppHandles.length > 1 && (
                    <button type="button" className="remove-contact-btn" onClick={() => removeContact(setCashAppHandles, i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-contact-btn" onClick={() => addContact(setCashAppHandles)}>+ add</button>
            </div>

            {/* Zelle */}
            <div className="field">
              <label>Zelle</label>
              {zelleContacts.map((c, i) => (
                <div className="multi-contact-row" key={i}>
                  <input
                    type="text"
                    placeholder="phone or email"
                    value={c}
                    onChange={e => updateContact(setZelleContacts, i, e.target.value)}
                  />
                  {zelleContacts.length > 1 && (
                    <button type="button" className="remove-contact-btn" onClick={() => removeContact(setZelleContacts, i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-contact-btn" onClick={() => addContact(setZelleContacts)}>+ add</button>
            </div>

            {/* Apple Pay */}
            <div className="field">
              <label>Apple Pay</label>
              {appleContacts.map((c, i) => (
                <div className="multi-contact-row" key={i}>
                  <input
                    type="text"
                    placeholder="phone number"
                    value={c}
                    onChange={e => updateContact(setAppleContacts, i, e.target.value)}
                  />
                  {appleContacts.length > 1 && (
                    <button type="button" className="remove-contact-btn" onClick={() => removeContact(setAppleContacts, i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-contact-btn" onClick={() => addContact(setAppleContacts)}>+ add</button>
            </div>
          </div>

          {/* Sync Contacts button — fills Zelle/Apple Pay from phone contacts & stores passengers */}
          <button type="button" className="sync-contacts-btn" onClick={syncContacts}>
            📇 Sync Contacts
          </button>

          {/* PaymentButtons only renders when there's a result to pay for */}
          {liveResult && (
            <PaymentButtons
              amount={liveResult.perPerson.toFixed(2)}
              venmoHandle={venmoHandles.find(h => h.trim()) || ''}
              cashAppHandle={cashAppHandles.find(h => h.trim()) || ''}
              zelleContact={zelleContacts.find(c => c.trim()) || ''}
              appleContact={appleContacts.find(c => c.trim()) || ''}
            />
          )}

          {/* Passenger payment requests — shown after syncing contacts */}
          {passengerContacts.length > 0 && liveResult && (
            <div className="passenger-requests">
              <p className="passenger-requests-label">Send payment requests to passengers:</p>
              {passengerContacts.map((contact, i) => {
                if (!contact.tel) return null
                const amount  = liveResult.perPerson.toFixed(2)
                const handle  = venmoHandles.find(h => h.trim()) || ''
                const payLink = handle
                  ? `https://venmo.com/u/${handle}?txn=pay&amount=${amount}&note=Gas`
                  : cashAppHandles.find(h => h.trim())
                    ? `https://cash.app/$${cashAppHandles.find(h => h.trim())}/${amount}`
                    : null
                const body = payLink
                  ? `Hey ${contact.name}, you owe $${amount} for gas! Pay here: ${payLink}`
                  : `Hey ${contact.name}, you owe $${amount} for gas!`
                return (
                  <a
                    key={i}
                    className="passenger-request-btn"
                    href={`sms:${contact.tel}?body=${encodeURIComponent(body)}`}
                  >
                    💬 Message {contact.name} — ${amount}
                  </a>
                )
              })}
            </div>
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
