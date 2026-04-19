import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getYears, getMakes, getModels, getOptions, getVehicleMPG } from '../api/fuelEconomy'
import { signOutUser } from '../firebase/auth'

const PAYMENT_FIELDS = [
  { id: 'venmoHandle',   label: 'Venmo',     prefix: '@', placeholder: 'username'     },
  { id: 'cashAppHandle', label: 'Cash App',  prefix: '$', placeholder: 'cashtag'      },
  { id: 'zelleContact',  label: 'Zelle',     prefix: '',  placeholder: 'phone or email' },
  { id: 'appleContact',  label: 'Apple Pay', prefix: '',  placeholder: 'phone or email' },
]

export default function ProfileModal({ onClose }) {
  const { currentUser, userProfile, saveProfile } = useAuth()

  // Car cascade
  const [years,        setYears]        = useState([])
  const [year,         setYear]         = useState(userProfile?.car?.year  || '')
  const [makes,        setMakes]        = useState([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [make,         setMake]         = useState(userProfile?.car?.make  || '')
  const [models,       setModels]       = useState([])
  const [loadingModels,setLoadingModels]= useState(false)
  const [model,        setModel]        = useState(userProfile?.car?.model || '')
  const [options,      setOptions]      = useState([])
  const [trimId,       setTrimId]       = useState(userProfile?.car?.trimId || '')
  const [mpg,          setMpg]          = useState(
    userProfile?.car ? {
      city:     userProfile.car.mpgCity     || null,
      highway:  userProfile.car.mpgHighway  || null,
      combined: userProfile.car.mpgCombined || null,
    } : null
  )
  const [loadingMpg,   setLoadingMpg]  = useState(false)

  // Payment
  const [payment, setPayment] = useState({
    venmoHandle:   userProfile?.payment?.venmoHandle   || '',
    cashAppHandle: userProfile?.payment?.cashAppHandle || '',
    zelleContact:  userProfile?.payment?.zelleContact  || '',
    appleContact:  userProfile?.payment?.appleContact  || '',
  })

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Load years on mount
  useEffect(() => {
    getYears().then(setYears).catch(() => {})
  }, [])

  useEffect(() => {
    if (!year) return
    setMake(''); setMakes([]); setModel(''); setModels([])
    setOptions([]); setTrimId(''); setMpg(null)
    setLoadingMakes(true)
    getMakes(year).then(setMakes).catch(() => {}).finally(() => setLoadingMakes(false))
  }, [year])

  useEffect(() => {
    if (!make) return
    setModel(''); setModels([]); setOptions([]); setTrimId(''); setMpg(null)
    setLoadingModels(true)
    getModels(year, make).then(setModels).catch(() => {}).finally(() => setLoadingModels(false))
  }, [make])

  useEffect(() => {
    if (!model) return
    setOptions([]); setTrimId(''); setMpg(null)
    setLoadingMpg(true)
    getOptions(year, make, model).then(opts => {
      setOptions(opts)
      if (opts.length === 1) setTrimId(opts[0].value)
      else setLoadingMpg(false)
    }).catch(() => setLoadingMpg(false))
  }, [model])

  useEffect(() => {
    if (!trimId) return
    setLoadingMpg(true)
    getVehicleMPG(trimId).then(setMpg).catch(() => {}).finally(() => setLoadingMpg(false))
  }, [trimId])

  async function handleSave() {
    setSaving(true)
    const carData = (year && make && model) ? {
      year, make, model,
      trimId:     trimId || '',
      mpgCity:     mpg?.city     ?? null,
      mpgHighway:  mpg?.highway  ?? null,
      mpgCombined: mpg?.combined ?? null,
      label: `${year} ${make} ${model}`,
    } : null

    await saveProfile({ car: carData, payment })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await signOutUser()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* User info */}
        <div className="profile-user-row">
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

        {/* Car section */}
        <p className="modal-section-label">Your Car</p>
        <div className="car-grid">
          <div className="field">
            <label>Year</label>
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
        {mpg && !loadingMpg && (
          <div className="profile-mpg-badge">
            <span className="mpg-number">{mpg.combined ?? '–'}</span>
            <span className="mpg-label">MPG combined</span>
            <span className="profile-mpg-sub">city {mpg.city ?? '–'} · hwy {mpg.highway ?? '–'}</span>
          </div>
        )}

        <hr className="modal-divider" />

        {/* Payment section */}
        <p className="modal-section-label">Your Payment Handles</p>
        <p className="modal-section-hint">Friends will see these when they split gas with you as the driver.</p>
        <div className="payment-handles">
          {PAYMENT_FIELDS.map(f => (
            <div className="field" key={f.id}>
              <label>{f.label}</label>
              <div className="handle-input-row">
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
          <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
          </button>
          <button className="modal-signout-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  )
}
