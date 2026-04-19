import { useState, useEffect, useRef } from 'react'
import { getYears, getMakes, getModels, getOptions, getVehicleMPG } from './api/fuelEconomy'
import { STATE_GAS_PRICES } from './data/gasPrices'
import RoadHero from './components/RoadHero'
import RoadGallery from './components/RoadGallery'
import PaymentButtons from './components/PaymentButtons'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import FriendsPanel from './components/FriendsPanel'
import { useAuth } from './contexts/AuthContext'
import './App.css'

export default function App() {
  // Trip
  const [miles, setMiles] = useState('')
  const [state, setState] = useState('')
  const [gasPrice, setGasPrice] = useState('')
  const [customGas, setCustomGas] = useState(false)

  // Car - API cascade
  const [years, setYears] = useState([])
  const [year, setYear] = useState('')
  const [makes, setMakes] = useState([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [make, setMake] = useState('')
  const [models, setModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [model, setModel] = useState('')
  const [options, setOptions] = useState([])
  const [optionId, setOptionId] = useState('')
  const [mpgData, setMpgData] = useState(null)
  const [mpgType, setMpgType] = useState('combined')
  const [loadingMpg, setLoadingMpg] = useState(false)
  const [carError, setCarError] = useState('')

  // Manual MPG override
  const [showManual, setShowManual] = useState(false)
  const [manualMpg, setManualMpg] = useState('')

  // Crew
  const [passengers, setPassengers] = useState(1)
  const [splitMode, setSplitMode] = useState('even')

  // Driver payment handles (optional)
  const [venmoHandle, setVenmoHandle] = useState('')
  const [cashAppHandle, setCashAppHandle] = useState('')

  // (result is computed live — no separate state needed)

  // Auth + UI modals
  const { currentUser, userProfile, friends, isEnabled } = useAuth()
  const [showAuth,    setShowAuth]    = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const menuRef = useRef(null)

  // Selected friend as driver (pre-fills car + payment)
  const [driverFriend, setDriverFriend] = useState(null)

  // Close header menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Pre-fill car + payment when a friend is selected as driver
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
    setVenmoHandle(friend.payment?.venmoHandle   || '')
    setCashAppHandle(friend.payment?.cashAppHandle || '')
  }

  function clearDriverFriend() {
    setDriverFriend(null)
    setMpgData(null)
    setYear(''); setMake(''); setModel('')
    setVenmoHandle(''); setCashAppHandle('')
  }

  // Load years on mount
  useEffect(() => {
    getYears()
      .then(setYears)
      .catch(() => setCarError('Could not load vehicle data. Enter MPG manually below.'))
  }, [])

  // Load makes when year changes
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

  // Load models when make changes
  useEffect(() => {
    if (!make) return
    setModel(''); setModels([]); setOptions([]); setOptionId(''); setMpgData(null); setCarError('')
    setLoadingModels(true)
    getModels(year, make)
      .then(setModels)
      .catch(() => setCarError('Could not load models.'))
      .finally(() => setLoadingModels(false))
  }, [make])

  // Load options when model changes
  useEffect(() => {
    if (!model) return
    setOptions([]); setOptionId(''); setMpgData(null); setCarError('')
    setLoadingMpg(true)
    getOptions(year, make, model)
      .then(opts => {
        setOptions(opts)
        if (opts.length === 1) setOptionId(opts[0].value)
        else setLoadingMpg(false)
      })
      .catch(() => {
        setCarError('Could not load trims.')
        setLoadingMpg(false)
      })
  }, [model])

  // Load MPG when a single option is auto-selected or user picks one
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

  // Auto-fill gas price when state changes (unless user already customized it)
  useEffect(() => {
    if (state && !customGas) {
      setGasPrice(STATE_GAS_PRICES[state]?.toFixed(2) ?? '')
    }
  }, [state])

  const activeMpg = () => {
    if (showManual && manualMpg) return parseFloat(manualMpg)
    if (!mpgData) return null
    return mpgData[mpgType] ?? null
  }

  const liveResult = (() => {
    const m = parseFloat(miles)
    const gp = parseFloat(gasPrice)
    const mpg = activeMpg()
    if (!m || !gp || !mpg) return null
    const gallons = m / mpg
    const totalCost = gallons * gp
    const perPerson = splitMode === 'even'
      ? totalCost / (passengers + 1)
      : totalCost / passengers
    return { gallons, totalCost, perPerson, passengers, splitMode, miles: m, mpg, gp }
  })()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1>Split Tank</h1>
            <p>Figure out what everyone owes</p>
          </div>

          {isEnabled && (
            <div className="header-auth" ref={menuRef}>
              {currentUser ? (
                <>
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
                <button className="sign-in-btn" onClick={() => setShowAuth(true)}>
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <RoadHero />

      <main className="app-main">

        {/* FRIEND DRIVER PICKER — only when logged in with friends */}
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
                  disabled={!f.car}
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

        {/* TRIP DETAILS */}
        <section className="card">
          <span className="section-title">Trip Details</span>

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

          <div className="field">
            <label>State</label>
            <select value={state} onChange={e => setState(e.target.value)}>
              <option value="">Select a state...</option>
              {Object.keys(STATE_GAS_PRICES).sort().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Gas price ($/gal)
              {state && !customGas && <span className="badge">State avg</span>}
            </label>
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
                  setGasPrice(STATE_GAS_PRICES[state]?.toFixed(2) ?? '')
                }}>
                  Reset to avg
                </button>
              )}
            </div>
          </div>
        </section>

        {/* THE CAR */}
        <section className="card">
          <span className="section-title">The Car</span>

          {/* When a friend is selected, show their car as a summary badge */}
          {driverFriend?.car && (
            <div className="friend-car-badge">
              <span className="friend-car-badge-name">{driverFriend.displayName}'s car</span>
              <span className="friend-car-badge-label">{driverFriend.car.label}</span>
            </div>
          )}

          {/* Only show cascade dropdowns if no friend is pre-selected */}
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

          {!driverFriend && options.length > 1 && (
            <div className="field">
              <label>Trim / Engine</label>
              <select
                value={optionId}
                onChange={e => setOptionId(e.target.value)}
              >
                <option value="">Select trim...</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
              </select>
            </div>
          )}

          {!driverFriend && loadingMpg && <p className="loading-text">Loading vehicle data...</p>}
          {!driverFriend && carError && !loadingMpg && <p className="car-error">{carError}</p>}

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

        {/* THE TOTAL */}
        <section className="card result-card">
          <span className="section-title">The Total</span>

          {/* Crew controls live inside this section */}
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

          {liveResult ? (
            <>
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
            </>
          ) : (
            <p className="total-placeholder">
              Fill in trip details and car info above to see the total.
            </p>
          )}
        </section>

        {/* PAYMENT INFO */}
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

          <div className="payment-handles">
            <div className="field">
              <label>Venmo username</label>
              <div className="handle-input-row">
                <span className="handle-prefix venmo-prefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={venmoHandle}
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
          </div>

          {liveResult && (
            <PaymentButtons
              amount={liveResult.perPerson.toFixed(2)}
              venmoHandle={venmoHandle}
              cashAppHandle={cashAppHandle}
            />
          )}
        </section>
      </main>

      <RoadGallery />

      <footer className="app-footer">
        Gas prices are state averages (EIA 2024 data) — override anytime.
      </footer>

      {/* Modals */}
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
