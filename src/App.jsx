// App.jsx — Root component: the entire Split Tank calculator
//
// This file owns all calculator state and wires every feature together.
// Everything the user sees and interacts with (except auth modals) lives here.
//
// ── WHERE DATA COMES FROM ─────────────────────────────────────────────────────
//  api/fuelEconomy.js   → year/make/model/trim dropdowns + MPG figures
//                          (calls FuelEconomy.gov REST API in a 5-step cascade)
//  api/gasPrice.js      → live $/gallon from EIA weekly data with 24-hr cache
//                          Falls back to data/gasPrices.js when API unavailable
//  data/gasPrices.js    → hardcoded state-average prices used as offline fallback
//  api/tollInflation.js → BLS CPI-U year-over-year multiplier (7-day cache)
//                          Applied to data/tollRates.js base rates in estimateTolls()
//  data/tollRates.js    → per-state toll event cost (base year: 2024 calibration)
//  api/counties.js      → Census Bureau county list for the county dropdown
//  contexts/AuthContext.jsx → currentUser, userProfile (saved car+payment),
//                             friends list, saveProfile() — all via Firebase
//
// ── HOW RESULTS ARE COMPUTED ──────────────────────────────────────────────────
//  1. miles (from route or manual input)
//  2. gasPrice (live EIA → fallback static → user manual override)
//  3. mpg (FuelEconomy.gov trim lookup OR manual entry OR city/highway blend
//     from OSRM speed annotations)
//  4. tollAmount (Overpass API toll booth nodes × inflated per-state rate)
//  5. liveResult (derived from 1–4 every render — no button press needed)
//
// ── COMPONENT TREE ────────────────────────────────────────────────────────────
//  App
//   ├─ RoadHero          (decorative banner SVG)
//   ├─ Combobox ×4       (year / make / model / trim inputs)
//   ├─ PaymentButtons    (Venmo / Cash App / Zelle / Apple Pay deep links)
//   ├─ RoadGallery       (three illustrated panels at page bottom)
//   ├─ AuthModal         (sign-in overlay — shown when showAuth=true)
//   ├─ ProfileModal      (car + payment save — shown when showProfile=true)
//   └─ FriendsPanel      (friends list + driver picker — shown when showFriends=true)

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { getYears, getMakes, getModels, getOptions, getVehicleMPG, estimateTankSize } from './api/fuelEconomy'
import { STATE_GAS_PRICES } from './data/gasPrices'      // offline fallback prices
import { getTollRate, TOLL_RATE_PER_MILE } from './data/tollRates'
import { fetchTollInflationMultiplier } from './api/tollInflation'  // BLS CPI multiplier
import { fetchStateGasPrice, fetchAllStatePrices, normalizeCounty, METRO_STATES } from './api/gasPrice'
import { fetchCounties } from './api/counties'             // Census Bureau county list
import Combobox from './components/Combobox'               // custom typeahead input (replaces <datalist>)
import PlaceAutocomplete from './components/PlaceAutocomplete'
import { expandAcronym } from './data/acronyms'
import RoadHero from './components/RoadHero'               // decorative SVG banner
import RoadGallery from './components/RoadGallery'         // three illustrated panels
import PaymentButtons from './components/PaymentButtons'   // Venmo/CashApp/Zelle/Apple Pay buttons
// Lazily loaded — pulled in only when the user first opens them
const GasPriceMap        = lazy(() => import('./components/GasPriceMap'))
const ElectricityRateMap = lazy(() => import('./components/ElectricityRateMap'))
const AuthModal    = lazy(() => import('./components/AuthModal'))
const ProfileModal = lazy(() => import('./components/ProfileModal'))
const FriendsPanel = lazy(() => import('./components/FriendsPanel'))
import { useAuth } from './contexts/AuthContext'           // Firebase auth state + Firestore profile
import './App.css'

// Scores a trim option string to estimate how commonly it sells in the US.
// Higher = more likely to be the volume trim. Ties go to the earlier index.
// Logic: 4-cyl outsells 6/8; FWD/RWD outsells AWD; automatics dominate;
// hybrids/EVs/performance variants are niche relative to base powertrain.
function trimPopularityScore(text) {
  const t = text.toLowerCase()
  let s = 0
  if (/\b4-?cyl\b|\bi-?4\b/.test(t))              s += 4
  if (/\b3-?cyl\b|\bi-?3\b/.test(t))              s += 3
  if (/\b6-?cyl\b|\bv-?6\b/.test(t))              s -= 1
  if (/\b8-?cyl\b|\bv-?8\b/.test(t))              s -= 3
  if (/\b(10|12)-?cyl\b|\bv-?1[02]\b/.test(t))   s -= 5
  if (/\bawd\b|\b4wd\b|\b4x4\b|\ball.?wheel/.test(t)) s -= 2
  if (/\bmanual\b|\bm\/t\b/.test(t))              s -= 2
  if (/\bphev\b|\bplug.?in\b/.test(t))            s -= 1
  if (/\bhybrid\b/.test(t))                       s -= 1
  if (/\belectric\b|\bbev\b/.test(t))             s -= 2
  return s
}

function mostCommonTrimIdx(opts) {
  if (opts.length <= 1) return 0
  let bestIdx = 0, bestScore = trimPopularityScore(opts[0].text)
  for (let i = 1; i < opts.length; i++) {
    const s = trimPopularityScore(opts[i].text)
    if (s > bestScore) { bestScore = s; bestIdx = i }
  }
  return bestIdx
}

export default function App() {

  // ── Trip state ────────────────────────────────────────────────────────────
  const [miles,         setMiles]         = useState('')    // miles driven (one way)
  const [roundTrip,     setRoundTrip]     = useState(false) // double miles for return trip
  const [state,         setState]         = useState('')    // US state name
  const [gasPrice,      setGasPrice]      = useState('')    // $/gallon
  const [customGas,     setCustomGas]     = useState(false) // true if user manually typed a price
  const [livePriceDate, setLivePriceDate]   = useState(null)  // "Apr 14" — when data was published
  const [livePriceLabel, setLivePriceLabel] = useState(null)  // "Los Angeles metro" — metro label
  const [livePriceSource, setLivePriceSource] = useState(null) // 'AAA' | 'EIA' | null

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
  const commonTrimIdx = useMemo(() => mostCommonTrimIdx(options), [options])
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

  // ── Passenger phone numbers for payment requests ──────────────────────────
  const [passengerPhones, setPassengerPhones] = useState([''])
  const [sentPhones,      setSentPhones]      = useState(new Set())

// ── Tolls ─────────────────────────────────────────────────────────────────
  const [tolls,            setTolls]            = useState('')
  const [tollsEstimated,   setTollsEstimated]   = useState(false)
  const [tollVehicleType,  setTollVehicleType]  = useState('2AxlesAuto')
  const [storedRouteCoords,setStoredRouteCoords]= useState(null)

  // ── Route / address lookup ────────────────────────────────────────────────
  const [tripFrom,     setTripFrom]     = useState('')
  const [tripTo,       setTripTo]       = useState('')
  const [fromCoords,   setFromCoords]   = useState(null)  // {lat,lon} pre-resolved by autocomplete
  const [toCoords,     setToCoords]     = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError,   setRouteError]   = useState('')
  const [cityRatio,    setCityRatio]    = useState(null) // 0–1 fraction that is city driving; null = not calculated
  const [showRoute,    setShowRoute]    = useState(true)
  const [showManualMiles, setShowManualMiles] = useState(false)
  const [routeSegments,   setRouteSegments]   = useState([])   // [{ state, miles, gasPrice }] — multi-state breakdown
  const [detectingStates, setDetectingStates] = useState(false)
  const [tankGallons,     setTankGallons]     = useState('')   // optional tank size for pit-stop calc

  // ── County state ──────────────────────────────────────────────────────────
  const [county,         setCounty]         = useState('')   // selected county name
  const [counties,       setCounties]       = useState([])   // list of all counties for the state
  const [loadingCounties,setLoadingCounties]= useState(false)

  // ── Geolocation state ─────────────────────────────────────────────────────
  const [detectingLocation,    setDetectingLocation]    = useState(false)
  const [detectingAddressLoc,  setDetectingAddressLoc]  = useState(false)
  const [detectedLocation,     setDetectedLocation]     = useState(null) // { city, county, state }
  const [locationError,        setLocationError]        = useState(null)
  const [locationDenied,       setLocationDenied]       = useState(false) // true when blocked by settings
  const [showManualState,      setShowManualState]      = useState(false)

  // ── Auth + modal state ────────────────────────────────────────────────────
  // useAuth() reads from AuthContext — the sign-in state managed in AuthContext.jsx
  const { currentUser, userProfile, friends, isEnabled, saveProfile } = useAuth()
  const [showAuth,    setShowAuth]    = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [showMap,     setShowMap]     = useState(false)
  const [mapMode,     setMapMode]     = useState('gas')  // 'gas' | 'electric'
  const [mapPrices,   setMapPrices]   = useState(null)   // live EIA prices for all 50 states

  // useRef stores a reference to the dropdown DOM element.
  // Unlike useState, changing a ref does NOT trigger a re-render.
  // We use it here to detect clicks outside the menu.
  const menuRef   = useRef(null)
  const resultRef = useRef(null)   // ref to the result card for auto-scroll

  // Selected friend as driver (pre-fills car + payment handles)
  const [driverFriend, setDriverFriend] = useState(null)

  // ── EV mode ───────────────────────────────────────────────────────────────
  const [isEV,           setIsEV]           = useState(false)
  const [electricityRate, setElectricityRate] = useState('0.16') // $/kWh
  const [milesPerKwh,    setMilesPerKwh]    = useState('')       // mi/kWh

  // ── Custom split percentages (one per passenger) ──────────────────────────
  const [customShares, setCustomShares] = useState([])

  // ── UI feedback state ─────────────────────────────────────────────────────
  const [copyLinkToast, setCopyLinkToast] = useState(false)
  const [tripSaved,     setTripSaved]     = useState(false)
  const [showTrips,     setShowTrips]     = useState(true)

  // ── Side effects ──────────────────────────────────────────────────────────

  // Close the header dropdown on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Restore calculator state from URL query params on mount.
  // Enables shareable links — e.g. splittank.com?m=150&st=Illinois&p=3
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('m'))  setMiles(p.get('m'))
    if (p.get('st')) setState(p.get('st'))
    if (p.get('co')) setCounty(p.get('co'))
    if (p.get('p'))  setPassengers(Math.max(1, parseInt(p.get('p'), 10) || 1))
    const sm = p.get('sm')
    if (sm === 'cover' || sm === 'custom') setSplitMode(sm)
    if (p.get('rt') === '1') setRoundTrip(true)
    if (p.get('tl')) setTolls(p.get('tl'))
    if (p.get('ev') === '1') {
      setIsEV(true)
      if (p.get('mpg')) setMilesPerKwh(p.get('mpg'))
      if (p.get('er'))  setElectricityRate(p.get('er'))
    } else {
      if (p.get('gp')) { setGasPrice(p.get('gp')); setCustomGas(true) }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When splitMode switches to 'custom' or passengers count changes in custom mode,
  // resize the customShares array — preserving existing values, filling new slots equally.
  useEffect(() => {
    if (splitMode !== 'custom') return
    setCustomShares(prev => {
      if (prev.length === passengers) return prev
      const share = parseFloat((100 / passengers).toFixed(1))
      return Array.from({ length: passengers }, (_, i) => prev[i] ?? share)
    })
  }, [passengers, splitMode])

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

  // ── Share + trip history helpers ──────────────────────────────────────────

  // Build a URL that encodes all current calculator inputs as query params.
  function buildShareURL() {
    const p = new URLSearchParams()
    if (miles) p.set('m', miles)
    if (state) p.set('st', state)
    if (county) p.set('co', county)
    if (isEV) {
      p.set('ev', '1')
      if (milesPerKwh) p.set('mpg', milesPerKwh)
      if (electricityRate !== '0.16') p.set('er', electricityRate)
    } else if (customGas && gasPrice) {
      p.set('gp', gasPrice)
    }
    if (passengers !== 1) p.set('p', String(passengers))
    if (splitMode !== 'even') p.set('sm', splitMode)
    if (roundTrip) p.set('rt', '1')
    if (tolls) p.set('tl', tolls)
    const str = p.toString()
    return str
      ? `${window.location.origin}${window.location.pathname}?${str}`
      : `${window.location.origin}${window.location.pathname}`
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(buildShareURL()) } catch { /* ignore */ }
    setCopyLinkToast(true)
    setTimeout(() => setCopyLinkToast(false), 3000)
  }

  function shareResult() {
    if (!liveResult) return
    navigator.share({
      title: 'Split Tank',
      url: buildShareURL(),
    }).catch(() => {})
  }

  // Save the current result to the signed-in user's trip history (max 5 trips).
  async function saveCurrentTrip() {
    if (!currentUser || !liveResult) return
    const trip = {
      id: Date.now(),
      ts: Date.now(),
      miles: parseFloat(miles),
      state: state || '',
      gasPrice: liveResult.gp,
      passengers,
      splitMode,
      totalCost: liveResult.totalCost,
      perPerson: liveResult.perPerson,
      mpg: liveResult.mpg,
      roundTrip,
      isEV,
    }
    const existing = userProfile?.trips ?? []
    await saveProfile({ trips: [trip, ...existing].slice(0, 5) })
    setTripSaved(true)
    setTimeout(() => setTripSaved(false), 3000)
  }

  // Restore calculator inputs from a saved trip.
  function loadTrip(trip) {
    setMiles(String(trip.miles))
    if (trip.state) setState(trip.state)
    setPassengers(trip.passengers)
    setSplitMode(trip.splitMode)
    setRoundTrip(trip.roundTrip ?? false)
    if (trip.isEV) {
      setIsEV(true)
      setMilesPerKwh(String(trip.mpg))
      setElectricityRate(String(trip.gasPrice))
    } else {
      setIsEV(false)
      setGasPrice(String(trip.gasPrice))
      setCustomGas(true)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Contact array helpers ─────────────────────────────────────────────────
  function addContact(setter)         { setter(prev => [...prev, '']) }
  function removeContact(setter, idx) { setter(prev => prev.filter((_, i) => i !== idx)) }
  function updateContact(setter, idx, val) {
    setter(prev => prev.map((v, i) => i === idx ? val : v))
  }

  // Build and open a pre-filled SMS to a passenger asking them to pay their share.
  // Picks the best available payment method: Venmo > Cash App > generic.
  // Includes trip context (miles, car) so passengers know exactly what they're paying for.
  function sendPaymentRequest(phone, result) {
    const venmo    = venmoHandles.find(h => h.trim())
    const cashApp  = cashAppHandles.find(h => h.trim())
    const amount   = result.perPerson.toFixed(2)
    const tripInfo = `${Math.round(result.miles)}-mile trip, ${result.mpg} ${result.isEV ? 'mi/kWh' : 'mpg'}`
    let msg
    if (venmo) {
      msg = `Hey! Your gas share for our ${tripInfo} is $${amount}. Tap to pay on Venmo: https://venmo.com/u/${venmo}?txn=pay&amount=${amount}&note=Split%20Tank — or search @${venmo} in the Venmo app.`
    } else if (cashApp) {
      msg = `Hey! Your gas share for our ${tripInfo} is $${amount}. Tap to pay on Cash App: https://cash.app/$${cashApp}/${amount} — or search $${cashApp} in Cash App.`
    } else {
      msg = `Hey! Your gas share for our ${tripInfo} is $${amount}. Pay me back when you get a chance — calculated on Split Tank (splittank.com)`
    }
    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`
  }

  // ── Route calculator ──────────────────────────────────────────────────────

  // Encodes a [lon, lat] coordinate array into Google's encoded polyline format.
  // Samples to ≤100 points so the payload stays small for long routes.
  function encodePolyline(coords) {
    const step = Math.max(1, Math.floor(coords.length / 100))
    const sampled = coords.filter((_, i) => i % step === 0)
    if (sampled[sampled.length - 1] !== coords[coords.length - 1])
      sampled.push(coords[coords.length - 1])

    let out = '', prevLat = 0, prevLon = 0
    for (const [lon, lat] of sampled) {
      const latE5 = Math.round(lat * 1e5)
      const lonE5 = Math.round(lon * 1e5)
      for (let val of [latE5 - prevLat, lonE5 - prevLon]) {
        val = val < 0 ? ~(val << 1) : val << 1
        while (val >= 0x20) { out += String.fromCharCode((0x20 | (val & 0x1f)) + 63); val >>= 5 }
        out += String.fromCharCode(val + 63)
      }
      prevLat = latE5; prevLon = lonE5
    }
    return out
  }

  // Geocodes a single query string with five levels of fallback.
  // Level 1: exact query → Nominatim → Photon
  // Level 2: exact query → Mapbox (if VITE_MAPBOX_TOKEN is set)
  // Level 3: exact query → Census proxy (/api/geocode — server-side, no CORS issues)
  // Level 4: strip house number → Nominatim → Photon
  // Level 5: city + state only → Nominatim → Photon
  async function geocode(rawQuery) {
    const query = expandAcronym(rawQuery) ?? rawQuery
    async function tryNominatim(q) {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        if (data?.[0]) return { lat: data[0].lat, lon: data[0].lon }
      } catch {}
      return null
    }

    async function tryPhoton(q) {
      try {
        const res    = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en`
        )
        const data   = await res.json()
        const coords = data?.features?.[0]?.geometry?.coordinates
        if (coords) return { lat: String(coords[1]), lon: String(coords[0]) }
      } catch {}
      return null
    }

    // Mapbox Search Box v1 — same engine as the autocomplete dropdown.
    // Best for POIs (nightclubs, colleges, landmarks) since v5 geocoding excludes them.
    async function tryMapboxSearchBox(q) {
      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (!token) return null
      try {
        const session = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))
        const suggestRes = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest` +
          `?q=${encodeURIComponent(q)}&access_token=${token}&session_token=${session}` +
          `&types=address,poi,place&limit=5&language=en&country=us`
        )
        const suggestData = await suggestRes.json()
        const suggestions = suggestData.suggestions ?? []
        // Prefer a POI over a generic city/place — e.g. "Aero Orlando" should resolve
        // to the venue, not the city of Orlando which Mapbox ranks first.
        const suggestion = suggestions.find(s => s.feature_type === 'poi') ?? suggestions[0]
        if (!suggestion?.mapbox_id) return null
        const retrieveRes = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}` +
          `?access_token=${token}&session_token=${session}`
        )
        const retrieveData = await retrieveRes.json()
        const feature = retrieveData.features?.[0]
        if (!feature) return null
        const [lon, lat] = feature.geometry.coordinates
        if (typeof lat !== 'number' || typeof lon !== 'number') return null
        return { lat, lon }
      } catch {}
      return null
    }

    // Mapbox v5 geocoding — addresses and places (not POIs).
    async function tryMapbox(q) {
      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (!token) return null
      try {
        const res  = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&limit=1&types=address,place,poi&country=us`
        )
        const data = await res.json()
        const coords = data?.features?.[0]?.center
        if (coords) return { lat: String(coords[1]), lon: String(coords[0]) }
      } catch {}
      return null
    }

    // Census TIGER/Line via our Vercel proxy — covers every US street.
    // Called server-side to avoid the Census API's missing CORS headers.
    async function tryCensus(q) {
      try {
        const res  = await fetch(`/api/geocode?address=${encodeURIComponent(q)}`)
        if (!res.ok) return null
        const data = await res.json()
        if (data.lat) return { lat: String(data.lat), lon: String(data.lon) }
      } catch {}
      return null
    }

    // Validate result is within the contiguous US / Alaska / Hawaii bounding box.
    // Filters out wrong geocoding hits (e.g. "Bijou" resolving to a European city).
    function isUSCoord(c) {
      if (!c) return false
      const lat = parseFloat(c.lat), lon = parseFloat(c.lon)
      return lat >= 17 && lat <= 72 && lon >= -180 && lon <= -65
    }

    // Level 1: Mapbox Search Box v1 — handles POIs, nightclubs, colleges, venues
    const r0 = await tryMapboxSearchBox(query)
    if (r0 && isUSCoord(r0)) return r0

    // Level 2: OSM Nominatim / Photon
    const r1 = await tryNominatim(query) ?? await tryPhoton(query)
    if (r1 && isUSCoord(r1)) return r1

    // Level 3: Mapbox v5 (addresses + places + POIs, US-filtered)
    const r2 = await tryMapbox(query)
    if (r2 && isUSCoord(r2)) return r2

    // Level 4: Census proxy (authoritative for every US street)
    const r3 = await tryCensus(query)
    if (r3 && isUSCoord(r3)) return r3

    // Level 5: strip leading house number ("2631 Clapham Ln, City, ST" → "Clapham Ln, City, ST")
    const withoutNumber = query.replace(/^\d+\s+/, '')
    if (withoutNumber !== query) {
      const r4 = await tryNominatim(withoutNumber) ?? await tryPhoton(withoutNumber)
      if (r4 && isUSCoord(r4)) return r4
    }

    // Level 6: city + state only — extract last two comma-separated parts
    const parts = query.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const cityState = parts.slice(-2).join(', ')
      if (cityState !== query) {
        const r5 = await tryNominatim(cityState) ?? await tryPhoton(cityState)
        if (r5 && isUSCoord(r5)) return r5
      }
    }

    return null
  }

  // Estimates toll costs for a route.
  // Primary:  TomTom Routing API — detects toll road sections, estimates cost by mileage.
  //           Requires TOMTOM_KEY in Vercel env vars (server-side only).
  // Fallback: OSM node + way detection — inflation-adjusted per-event/per-mile rates.
  async function estimateTolls(routeCoords, vehicleType = tollVehicleType) {
    if (!routeCoords?.length) return null

    // ── Primary: TomTom (toll road detection for exact origin→destination) ──
    try {
      const first = routeCoords[0]
      const last  = routeCoords[routeCoords.length - 1]
      const [r, inflationMult] = await Promise.all([
        fetch('/api/tolls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromLat: first[1], fromLon: first[0],
            toLat:   last[1],  toLon:   last[0],
            vehicleType,
          }),
        }),
        fetchTollInflationMultiplier(),
      ])
      if (r.ok) {
        const data = await r.json()
        if (data.tollMiles != null) {
          const baseRate = TOLL_RATE_PER_MILE[vehicleType] ?? TOLL_RATE_PER_MILE['2AxlesAuto']
          return parseFloat((data.tollMiles * baseRate * inflationMult).toFixed(2))
        }
      }
    } catch {}

    // ── Fallback: OSM node + way detection ────────────────────────────────
    const lats = routeCoords.map(c => c[1])
    const lons = routeCoords.map(c => c[0])
    const s = Math.min(...lats) - 0.05, n = Math.max(...lats) + 0.05
    const w = Math.min(...lons) - 0.05, e = Math.max(...lons) + 0.05

    const shortRoute = (n - s) < 3 && (e - w) < 3

    const mid = routeCoords[Math.floor(routeCoords.length / 2)]
    const [overpassRes, geoRes, inflationMultiplier] = await Promise.all([
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `[out:json][timeout:30];
(
  node["barrier"="toll_booth"](${s},${w},${n},${e});
  node["barrier"="toll_gantry"](${s},${w},${n},${e});
  node["highway"="toll_booth"](${s},${w},${n},${e});
  node["toll"="yes"](${s},${w},${n},${e});
  node["barrier"="payment_point"](${s},${w},${n},${e});
${shortRoute ? `  way["toll"="yes"](${s},${w},${n},${e});` : ''}
);
out geom;`,
      }),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${mid[1]}&lon=${mid[0]}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      ).catch(() => null),
      fetchTollInflationMultiplier(),
    ])

    const elements = (await overpassRes.json()).elements || []
    if (!elements.length) return 0

    const geoData   = geoRes ? await geoRes.json().catch(() => null) : null
    const stateName = geoData?.address?.state ?? null
    const ratePerEvent = getTollRate(stateName) * inflationMultiplier

    const NEAR = 0.002    // ~200 m — must be very close to route to count
    const CLUSTER = 0.001 // ~100 m — nearby booths in same plaza = one event

    // ── Toll nodes: physical booths ────────────────────────────────────────
    const nearNodes = elements
      .filter(el => el.type === 'node')
      .filter(pt => routeCoords.some(([lon, lat]) =>
        Math.abs(pt.lat - lat) < NEAR && Math.abs(pt.lon - lon) < NEAR
      ))
    const events = []
    for (const pt of nearNodes) {
      if (!events.some(ev => Math.abs(ev.lat - pt.lat) < CLUSTER && Math.abs(ev.lon - pt.lon) < CLUSTER))
        events.push(pt)
    }
    const nodeCost = events.length * ratePerEvent

    // ── Toll ways: electronically-tolled highway segments ──────────────────
    // For each way, find its geometry points that sit near the route,
    // sum the distances between consecutive on-route points → miles of toll road.
    const PER_MILE_RATE = 0.10 * inflationMultiplier  // ~$0.10/mile US average
    let wayMiles = 0
    for (const el of elements.filter(el => el.type === 'way')) {
      const onRoute = (el.geometry || []).filter(pt =>
        routeCoords.some(([lon, lat]) =>
          Math.abs(pt.lat - lat) < NEAR && Math.abs(pt.lon - lon) < NEAR
        )
      )
      if (onRoute.length < 2) continue
      for (let i = 1; i < onRoute.length; i++) {
        const dlat = onRoute[i].lat - onRoute[i - 1].lat
        const dlon = onRoute[i].lon - onRoute[i - 1].lon
        wayMiles += Math.sqrt(dlat * dlat + dlon * dlon) * 69
      }
    }
    const wayCost = wayMiles * PER_MILE_RATE

    const total = nodeCost + wayCost
    return total > 0 ? parseFloat(total.toFixed(2)) : 0
  }

  // Sample points along the OSRM route, reverse-geocode each to a US state, fetch
  // per-state live gas prices, and return weighted-average price across the whole route.
  async function detectRouteStates(coords, totalMiles) {
    if (!coords?.length || coords.length < 2) return null

    // Sample up to 14 evenly-spaced coordinate pairs from the dense geometry array.
    const N    = Math.min(14, coords.length)
    const step = (coords.length - 1) / (N - 1)
    const samples = Array.from({ length: N }, (_, i) =>
      coords[Math.min(Math.round(i * step), coords.length - 1)]
    )

    // zoom=5 = state-level reverse geocode — cheap and fast.
    // Parallel fetch is intentional: this is a single user-triggered action, not a loop.
    const stateNames = await Promise.all(
      samples.map(([lon, lat]) =>
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
          .then(r => r.json())
          .then(d => d?.address?.state ?? null)
          .catch(() => null)
      )
    )

    // Collapse consecutive same-state runs into segments with a sample count.
    const rawSegs = []
    let cur = stateNames[0], start = 0
    for (let i = 1; i < stateNames.length; i++) {
      if (stateNames[i] && stateNames[i] !== cur) {
        rawSegs.push({ state: cur, count: i - start })
        cur = stateNames[i]; start = i
      }
    }
    rawSegs.push({ state: cur, count: stateNames.length - start })

    // Keep only segments whose state name exists in our gas-price lookup.
    const valid = rawSegs.filter(s => s.state && STATE_GAS_PRICES[s.state])
    if (!valid.length) return null

    // Apportion total miles proportionally across recognised segments.
    const totalCount = valid.reduce((s, x) => s + x.count, 0)
    const withMiles  = valid.map(s => ({
      state: s.state,
      miles: Math.round(totalMiles * s.count / totalCount),
    }))

    // Fetch live gas prices for every unique state in parallel.
    const uniqueStates = [...new Set(withMiles.map(s => s.state))]
    const priceMap = {}
    await Promise.all(uniqueStates.map(async st => {
      const r = await fetchStateGasPrice(st).catch(() => null)
      priceMap[st] = r?.price ?? STATE_GAS_PRICES[st] ?? null
    }))

    const segments = withMiles.map(s => ({
      state:    s.state,
      miles:    s.miles,
      gasPrice: priceMap[s.state],
    }))

    // Weighted-average price weighted by miles fraction in each state.
    const weightedPrice = segments.reduce(
      (sum, s) => sum + (s.gasPrice ?? 0) * (s.miles / totalMiles), 0
    )

    return { segments, weightedPrice: parseFloat(weightedPrice.toFixed(3)) }
  }

  async function fetchRoute() {
    if (!tripFrom.trim() || !tripTo.trim()) return
    setRouteLoading(true)
    setRouteError('')
    setCityRatio(null)
    setRouteSegments([])
    try {
      // Use autocomplete-resolved coords directly when available — skips the geocoding chain
      const [from, to] = await Promise.all([
        fromCoords ? Promise.resolve(fromCoords) : geocode(tripFrom),
        toCoords   ? Promise.resolve(toCoords)   : geocode(tripTo),
      ])
      if (!from || !to) {
        setRouteError("Couldn't find one or both locations. Try adding a city or state, or use a well-known landmark name.")
        return
      }
      // overview=full gives a dense coordinate list (one point per road segment)
      // so the proximity check in estimateTolls can actually hit toll booth nodes.
      // overview=simplified produces ~50 sparse points for a 300-mile trip,
      // leaving multi-mile gaps that swallow every toll booth between them.
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&annotations=speed,distance`
      )
      const routeData = await routeRes.json()
      if (routeData.code !== 'Ok' || !routeData.routes?.[0]) {
        setRouteError("Couldn't find a driving route between those addresses.")
        return
      }
      const route = routeData.routes[0]
      const totalMiles = route.distance / 1609.34
      setMiles(totalMiles.toFixed(1))

      // Detect state boundaries along the route in the background so the UI
      // isn't blocked — state breakdown + weighted gas price appear once ready.
      setDetectingStates(true)
      detectRouteStates(route.geometry?.coordinates, totalMiles).then(result => {
        setDetectingStates(false)
        if (!result) return
        setRouteSegments(result.segments)
        if (result.segments.length > 1) {
          // Multi-state: auto-fill starting state + weighted-average gas price.
          if (result.segments[0]?.state) setState(result.segments[0].state)
          setGasPrice(result.weightedPrice.toFixed(2))
          setCustomGas(true)
        } else if (result.segments[0]?.state) {
          setState(result.segments[0].state)
        }
      }).catch(() => setDetectingStates(false))

      // City/highway split from per-segment speed annotations.
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

      // Estimate tolls from the route geometry in the background.
      const coords = route.geometry?.coordinates
      if (coords?.length) {
        setStoredRouteCoords(coords)
        estimateTolls(coords).then(amount => {
          if (amount !== null) {
            setTolls(String(amount))
            setTollsEstimated(true)
          }
        }).catch(() => {})
      }
    } catch {
      setRouteError('Route lookup failed. Try entering miles manually.')
    } finally {
      setRouteLoading(false)
    }
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

  // Returns device/browser-specific steps for re-enabling location access.
  // Shown only when the permission is blocked — keeps the message actionable.
  function getLocationHint() {
    const ua = navigator.userAgent
    const isIOS     = /iPad|iPhone|iPod/.test(ua)
    const isAndroid = /Android/.test(ua)
    const isSafari  = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)

    if (isIOS && isSafari)  return 'To fix: iPhone Settings → Privacy & Security → Location Services → Safari → "While Using"'
    if (isIOS)              return 'To fix: iPhone Settings → find your browser app → Location → "While Using"'
    if (isAndroid)          return 'To fix: tap the lock icon in your address bar → Permissions → Location → Allow'
    if (isSafari)           return 'To fix: Safari menu → Settings for This Website → Location → Allow'
    return 'To fix: click the lock icon in your address bar → Site settings → Location → Allow'
  }

  // Use the browser's Geolocation API to detect the user's location.
  // On iOS/Android, this prompts "Allow location access?".
  // We then reverse-geocode the coordinates to a state/county/city name
  // using the free Nominatim API from OpenStreetMap.
  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.')
      return
    }

    // Reset denial flag each time the user tries again
    setLocationDenied(false)
    setLocationError(null)

    // Check the permission state before requesting — if already permanently denied,
    // the browser silently skips the prompt and jumps straight to the error callback,
    // leaving users confused about why it failed. Detecting 'denied' upfront lets us
    // show actionable settings instructions immediately.
    if ('permissions' in navigator) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (perm.state === 'denied') {
          setLocationError('Location access is blocked for this site.')
          setLocationDenied(true)
          setShowManualState(true)
          return
        }
      } catch { /* Permissions API not supported — fall through to normal request */ }
    }

    setDetectingLocation(true)

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
      (err) => {  // error callback — called if user denies or OS blocks the request
        setDetectingLocation(false)
        if (err.code === 1) {
          // PERMISSION_DENIED: user tapped "Don't Allow" on this specific prompt
          setLocationError('Location access was denied.')
          setLocationDenied(true)
        } else {
          setLocationError('Could not get location. Select your state manually.')
        }
        setShowManualState(true)
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  // Detect gas price state from the starting address instead of GPS.
  // Uses autocomplete-resolved coords when available; falls back to geocoding the text.
  async function detectLocationFromAddress() {
    if (!tripFrom.trim()) return
    setDetectingAddressLoc(true)
    setLocationError(null)
    try {
      const coords = fromCoords ?? await geocode(tripFrom)
      if (!coords) {
        setLocationError("Couldn't find that address. Try being more specific.")
        setShowManualState(true)
        setDetectingAddressLoc(false)
        return
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const addr = data.address || {}
      const stateName = addr.state
      const city = addr.city || addr.town || addr.village || null
      const county = addr.county || addr.city_district || null
      if (stateName && STATE_GAS_PRICES[stateName]) {
        setState(stateName)
        setDetectedLocation({ city, county, state: stateName })
        setShowManualState(false)
      } else {
        setLocationError("Couldn't determine your state from that address.")
        setShowManualState(true)
      }
    } catch {
      setLocationError('Location lookup failed. Select your state manually.')
      setShowManualState(true)
    }
    setDetectingAddressLoc(false)
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

  // Trim selected → fetch MPG/efficiency data.
  // For EVs: auto-switches to EV mode and pre-fills mi/kWh from EPA data.
  // For gas cars: switches back to gas mode if we were in EV mode.
  useEffect(() => {
    if (!optionId) return
    setLoadingMpg(true)
    getVehicleMPG(optionId)
      .then(data => {
        setMpgData(data)
        if (data.isEV) {
          setIsEV(true)
          if (data.combMiPerKwh) setMilesPerKwh(String(data.combMiPerKwh))
        } else {
          setIsEV(false)
          if (!data.combined && !data.city && !data.highway) {
            setCarError('No MPG data for this vehicle. Enter it manually.')
          }
        }
      })
      .catch(() => setCarError('Could not load vehicle data. Enter values manually.'))
      .finally(() => setLoadingMpg(false))
  }, [optionId])

  // Fetch the live gas price whenever state, county, or EV-mode changes.
  // Skipped when the user has manually overridden the price OR when in EV mode
  // (electricity rate is entered manually). Including isEV in deps means toggling
  // EV off automatically re-fetches the state gas price.
  useEffect(() => {
    if (!state || customGas || isEV) return // eslint-disable-line react-hooks/exhaustive-deps
    setLivePriceDate(null)
    setLivePriceLabel(null)
    setLivePriceSource(null)
    fetchStateGasPrice(state, county || null).then(result => {
      if (result) {
        setGasPrice(result.price.toFixed(2))
        setLivePriceDate(formatEIADate(result.period))
        setLivePriceLabel(result.label ?? null)
        setLivePriceSource(result.source ?? null)
      } else {
        setGasPrice(STATE_GAS_PRICES[state]?.toFixed(2) ?? '')
      }
    })
  }, [state, county, isEV]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-estimate tolls when vehicle type changes (trucks pay different rates)
  useEffect(() => {
    if (!storedRouteCoords) return
    estimateTolls(storedRouteCoords, tollVehicleType).then(amount => {
      if (amount !== null) { setTolls(String(amount)); setTollsEstimated(true) }
    }).catch(() => {})
  }, [tollVehicleType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch live prices for all 50 states once on mount so the heat map
  // shows EIA weekly data instead of the static fallback prices.
  useEffect(() => {
    fetchAllStatePrices().then(prices => { if (prices) setMapPrices(prices) })
  }, [])

  // ── Computed values ───────────────────────────────────────────────────────
  const activeMpg = () => {
    if (showManual && manualMpg) return parseFloat(manualMpg)
    if (!mpgData) return null
    return mpgData[mpgType] ?? null   // mpgType is 'city', 'highway', or 'combined'
  }

  const liveResult = (() => {
    const m = parseFloat(miles)
    if (!m) return null
    const effectiveMiles = roundTrip ? m * 2 : m

    let gallons, mpg, gasCost, effectiveGp

    if (isEV) {
      const eff  = parseFloat(milesPerKwh)
      const rate = parseFloat(electricityRate)
      if (!eff || !rate) return null
      gallons    = effectiveMiles / eff   // gallons = kWh in EV context
      mpg        = eff
      gasCost    = gallons * rate
      effectiveGp = rate
    } else {
      const gp = parseFloat(gasPrice)
      if (!gp) return null
      effectiveGp = gp

      if (cityRatio !== null && mpgData?.city && mpgData?.highway && !showManual) {
        const cityM = effectiveMiles * cityRatio
        const hwyM  = effectiveMiles * (1 - cityRatio)
        gallons = cityM / mpgData.city + hwyM / mpgData.highway
        mpg     = parseFloat((effectiveMiles / gallons).toFixed(1))
      } else {
        mpg = activeMpg()
        if (!mpg) return null
        gallons = effectiveMiles / mpg
      }
      gasCost = gallons * gp
    }

    const tollAmount = (parseFloat(tolls) || 0) * (roundTrip ? 2 : 1)
    const totalCost  = gasCost + tollAmount

    // ── Split calculations ────────────────────────────────────────────────
    let perPerson, customAmounts, driverPct, driverAmount, totalSharePct
    if (splitMode === 'custom' && customShares.length > 0) {
      const shares    = customShares.slice(0, passengers).map(s => parseFloat(s) || 0)
      totalSharePct   = shares.reduce((a, b) => a + b, 0)
      customAmounts   = shares.map(s => totalCost * (s / 100))
      driverPct       = Math.max(0, 100 - totalSharePct)
      driverAmount    = totalCost * (driverPct / 100)
      perPerson       = customAmounts[0] ?? 0
    } else {
      perPerson = splitMode === 'even'
        ? totalCost / (passengers + 1)
        : totalCost / passengers
    }

    return {
      gallons, gasCost, tollAmount, totalCost, perPerson,
      passengers, splitMode, miles: effectiveMiles, mpg, gp: effectiveGp,
      cityRatio, roundTrip, isEV,
      ...(splitMode === 'custom' ? { customAmounts, driverPct, driverAmount, totalSharePct } : {}),
    }
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

        {/* ── RECENT TRIPS (signed-in users only) ────────────────────────────── */}
        {isEnabled && currentUser && userProfile?.trips?.length > 0 && (
          <section className="card recent-trips-card">
            <div className="section-header">
              <span className="section-title">Recent Trips</span>
              <button className="toggle-link" onClick={() => setShowTrips(t => !t)}>
                {showTrips ? 'hide' : 'show'}
              </button>
            </div>
            {showTrips && (
              <div className="trip-history-list">
                {userProfile.trips.map(trip => (
                  <button key={trip.id} className="trip-history-item" onClick={() => loadTrip(trip)}>
                    <div className="trip-history-main">
                      <span className="trip-history-route">
                        {trip.miles} mi{trip.roundTrip ? ' (RT)' : ''}{trip.state ? ` · ${trip.state}` : ''}
                      </span>
                      <span className="trip-history-amount">${trip.perPerson.toFixed(2)}/person</span>
                    </div>
                    <div className="trip-history-meta">
                      {trip.isEV ? `${trip.mpg} mi/kWh` : `${trip.mpg} mpg`} · {trip.passengers}p · {trip.splitMode === 'even' ? 'even' : trip.splitMode === 'cover' ? 'cover' : 'custom'}
                      <span className="trip-history-date">
                        {new Date(trip.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TRIP DETAILS ──────────────────────────────────────────────────── */}
        <section className="card">
          <div className="section-header">
            <span className="section-title">Trip Details</span>
            <label className="round-trip-toggle">
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={e => setRoundTrip(e.target.checked)}
              />
              Round trip
            </label>
          </div>

          {/* Fuel type toggle — Gas vs Electric */}
          <div className="fuel-toggle-row">
            <button
              className={`fuel-toggle-btn${!isEV ? ' active' : ''}`}
              onClick={() => setIsEV(false)}
            >
              ⛽ Gas
            </button>
            <button
              className={`fuel-toggle-btn${isEV ? ' active' : ''}`}
              onClick={() => setIsEV(true)}
            >
              ⚡ Electric
            </button>
          </div>

          {/* Route calculator — primary input, always shown */}
          <div className="field">
            <label>From / To</label>
            <div className="route-fields">
                <PlaceAutocomplete
                  value={tripFrom}
                  onChange={v => { setTripFrom(v); setCityRatio(null); setRouteSegments([]) }}
                  onSelect={setFromCoords}
                  placeholder="From — city, address, or place name"
                />
                <PlaceAutocomplete
                  value={tripTo}
                  onChange={v => { setTripTo(v); setCityRatio(null); setRouteSegments([]) }}
                  onSelect={setToCoords}
                  placeholder="To — city, address, or place name"
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

                {/* Multi-state breakdown — shown once detectRouteStates finishes */}
                {detectingStates && (
                  <p className="route-states-loading">Detecting states along route…</p>
                )}
                {routeSegments.length > 1 && (() => {
                  // Pit-stop recommendations: fill up when range won't cover the next
                  // segment, or when the next state's price is >5% more expensive.
                  const mpg  = (showManual && manualMpg) ? parseFloat(manualMpg) : (mpgData?.[mpgType] ?? null)
                  const manualTank = parseFloat(tankGallons)
                  const tank = manualTank > 0 ? manualTank : (estimateTankSize(mpgData?.vclass) ?? null)
                  const tankIsEstimate = !(manualTank > 0) && tank != null
                  const range = (mpg && tank) ? mpg * tank : null
                  const pitStopIdx = new Set()
                  if (range) {
                    let milesSinceFill = 0
                    for (let i = 0; i < routeSegments.length - 1; i++) {
                      milesSinceFill += routeSegments[i].miles
                      const remaining  = range - milesSinceFill
                      const nextMiles  = routeSegments[i + 1].miles
                      const cantMakeIt = remaining < nextMiles + 30
                      const nextPricier = routeSegments[i + 1]?.gasPrice && routeSegments[i]?.gasPrice &&
                                          routeSegments[i + 1].gasPrice > routeSegments[i].gasPrice * 1.05
                      if (cantMakeIt || nextPricier) {
                        pitStopIdx.add(i)
                        milesSinceFill = 0
                      }
                    }
                  }

                  const totalMilesCalc = parseFloat(miles) || 1
                  const weightedAvg = routeSegments.reduce(
                    (s, seg) => s + (seg.gasPrice ?? 0) * (seg.miles / totalMilesCalc), 0
                  )

                  return (
                    <div className="route-states">
                      <div className="route-states-header">
                        <span>Route passes through {routeSegments.length} states</span>
                        <span>Weighted avg ${weightedAvg.toFixed(2)}/gal</span>
                      </div>
                      {tankIsEstimate && range && (
                        <p className="route-states-note">
                          ⛽ Refuel tips based on ~{tank} gal estimated tank — enter your actual tank size below for accuracy.
                        </p>
                      )}
                      {routeSegments.map((seg, i) => (
                        <div className="route-state-row" key={i}>
                          <span className="route-state-name">{seg.state}</span>
                          <span className="route-state-miles">{Math.round(seg.miles)} mi</span>
                          <span className="route-state-price">
                            ${seg.gasPrice?.toFixed(2) ?? '—'}/gal
                          </span>
                          {pitStopIdx.has(i) && (
                            <span className="pit-stop-tag">⛽ Fill up here</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
          </div>

          {/* Miles driven — manual override, hidden when route auto-fills it */}
          {miles && !showManualMiles ? (
            <div className="field">
              <div className="miles-auto-row">
                <span className="miles-auto-value">{parseFloat(miles).toFixed(1)} miles</span>
                <button type="button" className="toggle-link" onClick={() => setShowManualMiles(true)}>
                  edit
                </button>
              </div>
            </div>
          ) : (
            <div className="field">
              <label>
                Miles driven
                {miles && (
                  <button type="button" className="toggle-link" onClick={() => setShowManualMiles(false)}>
                    use route distance
                  </button>
                )}
              </label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={miles}
                onChange={e => { setMiles(e.target.value); setCityRatio(null) }}
                min="0"
              />
            </div>
          )}


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
                  disabled={detectingLocation || detectingAddressLoc}
                >
                  {detectingLocation
                    ? <><span className="location-spinner" /> Detecting your location…</>
                    : <><span className="location-pin-icon">📍</span> Use My Location</>
                  }
                </button>

                {tripFrom.trim() && (
                  <button
                    type="button"
                    className="use-address-loc-btn"
                    onClick={detectLocationFromAddress}
                    disabled={detectingLocation || detectingAddressLoc}
                  >
                    {detectingAddressLoc
                      ? <><span className="location-spinner" /> Detecting…</>
                      : <>Or use starting address</>
                    }
                  </button>
                )}

                {locationError && (
                  <div className="location-error-block">
                    <p className="location-error">{locationError}</p>
                    {locationDenied && (
                      <p className="location-hint">{getLocationHint()}</p>
                    )}
                  </div>
                )}

                {/* Show the manual state dropdown only if location failed or user chose it */}
                {showManualState ? (
                  <div className="manual-state-row">
                    <select value={state} onChange={e => setState(e.target.value)}>
                      <option value="">Select a state...</option>
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

          {/* Gas price / electricity rate — switches label and behaviour in EV mode */}
          {isEV ? (
            <div className="field">
              <label>Electricity rate ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 0.16"
                value={electricityRate}
                onChange={e => setElectricityRate(e.target.value)}
                min="0"
              />
              <p className="county-note">National avg ~$0.16/kWh · check your utility bill for your exact rate</p>
            </div>
          ) : (
            <div className="field">
              <label>
                Gas price ($/gal)
                {/* Badge: route weighted avg (multi-state), live EIA/AAA, or state avg */}
                {routeSegments.length > 1 && customGas ? (
                  <span className="badge badge-route">Route weighted avg</span>
                ) : state && !customGas ? (
                  <span className="badge">
                    {livePriceDate
                      ? `${livePriceSource === 'AAA' ? 'AAA' : 'EIA'} · ${livePriceDate}${livePriceLabel ? ` · ${livePriceLabel}` : ''}`
                      : 'State avg'}
                  </span>
                ) : null}
              </label>

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
                  onChange={e => { setGasPrice(e.target.value); setCustomGas(true) }}
                  min="0"
                />
                {customGas && state && (
                  <button className="reset-btn" onClick={() => {
                    setCustomGas(false)
                    setLivePriceDate(null)
                    setLivePriceLabel(null)
                    setLivePriceSource(null)
                    fetchStateGasPrice(state, county || null).then(result => {
                      if (result) {
                        setGasPrice(result.price.toFixed(2))
                        setLivePriceDate(formatEIADate(result.period))
                        setLivePriceLabel(result.label ?? null)
                        setLivePriceSource(result.source ?? null)
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
          )}
        </section>

        {/* ── THE CAR ───────────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">{isEV ? 'The Vehicle (Efficiency)' : 'The Car (Mileage)'}</span>

          {/* Friend's car summary — shown when a friend is pre-selected as driver */}
          {driverFriend?.car && (
            <div className="friend-car-badge">
              <span className="friend-car-badge-name">{driverFriend.displayName}'s car</span>
              <span className="friend-car-badge-label">{driverFriend.car.label}</span>
            </div>
          )}

          {/* Vehicle lookup — always shown for both EV and gas modes.
              Selecting an EV trim auto-switches to EV mode and fills mi/kWh from EPA data. */}
          {!driverFriend && (
            <>
              {isEV && !mpgData?.isEV && (
                <p className="county-note" style={{marginBottom: 8}}>
                  Select your EV below to auto-fill efficiency from EPA data, or enter mi/kWh manually.
                </p>
              )}
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
                    placeholder={loadingMakes ? 'Loading…' : year ? 'e.g. Tesla' : 'Enter year first'}
                    disabled={!year || loadingMakes}
                  />
                </div>

                <div className="field">
                  <label>Model</label>
                  <Combobox
                    options={models}
                    value={model}
                    onChange={setModel}
                    placeholder={loadingModels ? 'Loading…' : make ? 'e.g. Model 3' : 'Enter make first'}
                    disabled={!make || loadingModels}
                  />
                </div>
              </div>

              {/* Trim picker — only shown when model has multiple trims */}
              {options.length > 1 && (
                <div className="field">
                  <label>Trim / Engine</label>
                  <Combobox
                    options={options.map((o, i) =>
                      i === commonTrimIdx ? `${o.text} (Most Common)` : o.text
                    )}
                    value={optionText}
                    onChange={text => {
                      setOptionText(text)
                      const match = options.find((o, i) =>
                        text === (i === commonTrimIdx ? `${o.text} (Most Common)` : o.text)
                      )
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

          {/* EV mode: EPA badges + mi/kWh input */}
          {isEV ? (
            <>
              {mpgData?.isEV && (
                <div className="ev-specs-row">
                  {mpgData.epaRange && (
                    <span className="ev-spec-badge">
                      EPA range: {mpgData.epaRange} mi
                    </span>
                  )}
                  {mpgData.combMiPerKwh && (
                    <span className="ev-spec-badge">
                      {mpgData.combMiPerKwh} mi/kWh combined
                    </span>
                  )}
                  {mpgData.cityMiPerKwh && (
                    <span className="ev-spec-badge">
                      {mpgData.cityMiPerKwh} mi/kWh city
                    </span>
                  )}
                  {mpgData.highwayMiPerKwh && (
                    <span className="ev-spec-badge">
                      {mpgData.highwayMiPerKwh} mi/kWh hwy
                    </span>
                  )}
                </div>
              )}
              <div className="field">
                <label>Efficiency (mi/kWh)
                  {mpgData?.isEV && milesPerKwh && <span className="badge">EPA data</span>}
                </label>
                <div className="manual-mpg-row">
                  <input
                    type="number"
                    placeholder="e.g. 4.0"
                    value={milesPerKwh}
                    onChange={e => setMilesPerKwh(e.target.value)}
                    min="0.1"
                    step="0.1"
                  />
                  <span>mi/kWh</span>
                </div>
                {!mpgData?.isEV && (
                  <p className="county-note" style={{marginTop: 6}}>Typical: 3–5 mi/kWh · find it on your car's dashboard or EPA spec sheet</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* MPG display with city/combined/highway tabs */}
              {mpgData && !loadingMpg && !showManual && (
                <div className="mpg-display">
                  <div className="mpg-tabs">
                    {['city', 'combined', 'highway'].map(t => (
                      <button
                        key={t}
                        className={`mpg-tab${mpgType === t ? ' active' : ''}`}
                        onClick={() => setMpgType(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="mpg-value">
                    <span className="mpg-number">{mpgData[mpgType] ?? '--'}</span>
                    <span className="mpg-label">MPG</span>
                  </div>
                </div>
              )}

              {/* Manual MPG entry */}
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
            </>
          )}

          {/* Tank size — shown in car section for all gas trips so users can enter it
              alongside their MPG. Used for refuel tips on multi-state routes. */}
          {!isEV && (
            <div className="field">
              <label>
                Tank size (gal)
                <span className="badge badge-optional">optional</span>
              </label>
              <input
                type="number"
                placeholder="Check fuel filler door or owner's manual"
                value={tankGallons}
                onChange={e => setTankGallons(e.target.value)}
                min="1"
                step="0.5"
              />
              {routeSegments.length > 1 && tankGallons && (
                <p className="county-note">Used to recommend the best states to fill up in.</p>
              )}
              {routeSegments.length > 1 && !tankGallons && (
                <p className="county-note">Enter to get refuel tips for your multi-state route.</p>
              )}
            </div>
          )}
        </section>

        {/* ── TOLLS ────────────────────────────────────────────────────────── */}
        <section className="card">
          <span className="section-title">Tolls</span>
          <p className="payment-info-hint">
            {tollsEstimated
              ? tolls === '0'
                ? 'No tolls detected on this route — edit if you know otherwise.'
                : 'Auto-estimated from your route — edit if you know the exact amount.'
              : 'Tolls are auto-filled when you enter both addresses above.'}
          </p>
          <div className="fuel-toggle-row">
            {[
              { value: '2AxlesAuto', label: '🚗 Car / SUV' },
              { value: '3Axles',     label: '🚚 Truck / Van' },
              { value: '5Axles',     label: '🚛 Semi / 18-Wheeler' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`fuel-toggle-btn${tollVehicleType === opt.value ? ' active' : ''}`}
                onClick={() => setTollVehicleType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="field">
            <label>
              Total tolls ($)
              {tollsEstimated && <span className="badge">estimated</span>}
            </label>
            <input
              type="number"
              step="0.25"
              placeholder="e.g. 8.50"
              value={tolls}
              onChange={e => { setTolls(e.target.value); setTollsEstimated(false) }}
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
              <label className={`split-option${splitMode === 'custom' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="split"
                  checked={splitMode === 'custom'}
                  onChange={() => setSplitMode('custom')}
                />
                <div className="split-option-text">
                  <strong>Custom percentages</strong>
                  <p>Each passenger pays a different share — set the % below</p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom share percentage inputs — shown only in custom mode */}
          {splitMode === 'custom' && (
            <div className="custom-shares-section">
              {Array.from({ length: passengers }).map((_, i) => (
                <div key={i} className="custom-share-row">
                  <span className="custom-share-label">Passenger {i + 1}</span>
                  <div className="custom-share-input-row">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={customShares[i] ?? ''}
                      onChange={e => {
                        const updated = [...customShares]
                        updated[i] = e.target.value
                        setCustomShares(updated)
                      }}
                    />
                    <span>%</span>
                  </div>
                  {liveResult?.customAmounts && (
                    <span className="custom-share-amount">
                      ${(liveResult.customAmounts[i] ?? 0).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              {(() => {
                const total = customShares.slice(0, passengers).reduce((a, b) => a + (parseFloat(b) || 0), 0)
                const driver = Math.max(0, 100 - total).toFixed(1)
                return (
                  <p className="custom-shares-summary">
                    Passengers: {total.toFixed(1)}% · Driver pays: {driver}%
                    {Math.abs(total - 100) > 0.1 && total > 100 && (
                      <span className="custom-shares-warning"> — over 100%</span>
                    )}
                  </p>
                )
              })()}
            </div>
          )}

          {/* Show results if all inputs are filled, otherwise show placeholder */}
          {liveResult ? (
            <>
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">{liveResult.isEV ? 'kWh used' : 'Gas used'}</span>
                  <span className="stat-value">{liveResult.gallons.toFixed(2)} {liveResult.isEV ? 'kWh' : 'gal'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{liveResult.tollAmount > 0 ? (liveResult.isEV ? 'Elec. cost' : 'Gas cost') : (liveResult.isEV ? 'Elec. cost' : 'Total gas cost')}</span>
                  <span className="stat-value">${liveResult.gasCost.toFixed(2)}</span>
                </div>
                {liveResult.tollAmount > 0 && (
                  <div className="stat">
                    <span className="stat-label">Tolls</span>
                    <span className="stat-value">${liveResult.tollAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-label">{liveResult.isEV ? 'Efficiency' : 'MPG used'}</span>
                  <span className="stat-value">{liveResult.mpg} {liveResult.isEV ? 'mi/kWh' : 'mpg'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{liveResult.isEV ? 'Rate/kWh' : 'Price/gal'}</span>
                  <span className="stat-value">${liveResult.gp.toFixed(2)}</span>
                </div>
              </div>

              {/* Custom split breakdown — shown instead of the single big number */}
              {liveResult.splitMode === 'custom' && liveResult.customAmounts ? (
                <div className="custom-split-result">
                  {liveResult.customAmounts.map((amt, i) => (
                    <div key={i} className="custom-split-result-row">
                      <span>Passenger {i + 1} ({customShares[i]}%)</span>
                      <span className="custom-split-result-amount">${amt.toFixed(2)}</span>
                    </div>
                  ))}
                  {liveResult.driverPct > 0.05 && (
                    <div className="custom-split-result-row custom-split-result-driver">
                      <span>Driver ({liveResult.driverPct.toFixed(1)}%)</span>
                      <span className="custom-split-result-amount">${liveResult.driverAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="custom-split-result-total">
                    Total: ${liveResult.totalCost.toFixed(2)}
                  </div>
                </div>
              ) : (
                /* Big per-person number — the main result */
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
              )}

              <div className="result-actions">
                {navigator.share && (
                  <button className="share-btn" onClick={shareResult}>
                    📤 Share
                  </button>
                )}
                <button className="copy-link-btn" onClick={copyLink}>
                  {copyLinkToast ? '✓ Copied!' : '🔗 Copy link'}
                </button>
                {isEnabled && currentUser && (
                  <button className="save-trip-btn" onClick={saveCurrentTrip}>
                    {tripSaved ? '✓ Saved' : '💾 Save trip'}
                  </button>
                )}
              </div>
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

          {/* Send your share — appears once the calculator has a result */}
          {liveResult ? (
            <PaymentButtons
              amount={liveResult.perPerson.toFixed(2)}
              venmoHandle={venmoHandles.find(h => h.trim()) || ''}
              cashAppHandle={cashAppHandles.find(h => h.trim()) || ''}
              zelleContact={zelleContacts.find(c => c.trim()) || ''}
              appleContact={appleContacts.find(c => c.trim()) || ''}
            />
          ) : (
            <p className="payment-pending-hint">
              Fill in the trip details above to unlock the send button.
            </p>
          )}

          {/* ── REQUEST FROM PASSENGERS ──────────────────────────────────── */}
          {liveResult && (
            <div className="request-section">
              <p className="payment-heading">Request from passengers</p>
              <p className="payment-info-hint" style={{ marginBottom: 10 }}>
                Enter each passenger's phone number and tap Send — they'll get
                a text with the amount and a direct payment link.
              </p>
              {passengerPhones.map((phone, i) => {
                const wasSent = sentPhones.has(i)
                return (
                  <div className="request-row" key={i}>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={e => {
                        updateContact(setPassengerPhones, i, e.target.value)
                        setSentPhones(prev => { const n = new Set(prev); n.delete(i); return n })
                      }}
                      className="request-phone-input"
                    />
                    <button
                      type="button"
                      className={`request-send-btn${wasSent ? ' sent' : ''}`}
                      disabled={!phone.trim()}
                      onClick={() => {
                        sendPaymentRequest(phone.trim(), liveResult)
                        setSentPhones(prev => new Set(prev).add(i))
                      }}
                    >
                      {wasSent ? 'Sent ✓' : 'Send'}
                    </button>
                    {passengerPhones.length > 1 && (
                      <button
                        type="button"
                        className="remove-contact-btn"
                        onClick={() => {
                          removeContact(setPassengerPhones, i)
                          setSentPhones(prev => { const n = new Set(prev); n.delete(i); return n })
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                type="button"
                className="add-contact-btn"
                onClick={() => addContact(setPassengerPhones)}
              >
                + add passenger
              </button>

              {/* Fallback: show the handle as plain text so passengers can copy it manually */}
              {(venmoHandles.find(h => h.trim()) || cashAppHandles.find(h => h.trim()) || zelleContacts.find(c => c.trim())) && (
                <div className="request-fallback">
                  <p className="request-fallback-label">If the link doesn't open, share your handle directly:</p>
                  {venmoHandles.find(h => h.trim()) && (
                    <span className="request-fallback-handle">Venmo: @{venmoHandles.find(h => h.trim())}</span>
                  )}
                  {cashAppHandles.find(h => h.trim()) && (
                    <span className="request-fallback-handle">Cash App: ${cashAppHandles.find(h => h.trim())}</span>
                  )}
                  {zelleContacts.find(c => c.trim()) && (
                    <span className="request-fallback-handle">Zelle: {zelleContacts.find(c => c.trim())}</span>
                  )}
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      <div className="gas-map-toggle-section">
        <div className="gas-map-toggle-header">
          <button
            className="gas-map-toggle-btn"
            onClick={() => setShowMap(s => !s)}
            aria-expanded={showMap}
          >
            <span>{mapMode === 'electric' ? 'Electricity Rate Map' : 'Gas Price Heat Map'}</span>
            <span className="gas-map-toggle-icon" aria-hidden="true">{showMap ? '▲' : '▼'}</span>
          </button>
          {showMap && (
            <div className="map-mode-toggle">
              <button
                className={`map-mode-btn${mapMode === 'gas' ? ' active' : ''}`}
                onClick={() => setMapMode('gas')}
              >
                Gas
              </button>
              <button
                className={`map-mode-btn${mapMode === 'electric' ? ' active' : ''}`}
                onClick={() => setMapMode('electric')}
              >
                Electric
              </button>
            </div>
          )}
        </div>
        {showMap && (
          <Suspense fallback={null}>
            {mapMode === 'electric'
              ? <ElectricityRateMap selectedState={state} electricityRate={electricityRate} />
              : <GasPriceMap selectedState={state} selectedPrice={gasPrice} mapPrices={mapPrices} />
            }
          </Suspense>
        )}
      </div>

      <RoadGallery />

      <footer className="app-footer">
        {isEV ? 'Electricity rate entered manually.' : 'Gas prices sourced from AAA (daily) with EIA as fallback.'}
      </footer>

      {/* Modals — lazily loaded, each renders as an overlay when triggered. */}
      <Suspense fallback={null}>
        {showAuth    && <AuthModal    onClose={() => setShowAuth(false)} />}
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        {showFriends && (
          <FriendsPanel
            onSelectDriver={applyDriverFriend}
            onClose={() => setShowFriends(false)}
          />
        )}
      </Suspense>
    </div>
  )
}
