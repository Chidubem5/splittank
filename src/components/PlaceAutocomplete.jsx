import { useState, useRef, useEffect } from 'react'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Mapbox Search Box v1 — much better POI coverage than v5 geocoding.
// Two-step: suggest() → retrieve() to get coordinates.
// Session token groups requests for billing efficiency.
function makeSessionToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export default function PlaceAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [open,        setOpen]        = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const debounceRef    = useRef(null)
  const containerRef   = useRef(null)
  const sessionRef     = useRef(makeSessionToken())

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    onChange(q)
    onSelect(null)
    setActiveIdx(-1)

    if (!TOKEN) {
      console.warn('[PlaceAutocomplete] VITE_MAPBOX_TOKEN is not set — autocomplete disabled')
      setSuggestions([]); setOpen(false); return
    }
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest` +
          `?q=${encodeURIComponent(q)}` +
          `&access_token=${TOKEN}` +
          `&session_token=${sessionRef.current}` +
          `&types=address,poi,place,locality,neighborhood,postcode` +
          `&poi_category=education,entertainment,nightlife,landmark,venue` +
          `&proximity=ip` +
          `&limit=5` +
          `&language=en`
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('[PlaceAutocomplete] Mapbox API error', res.status, err)
          setSuggestions([]); return
        }
        const data = await res.json()
        console.log('[PlaceAutocomplete] suggestions:', data.suggestions?.length ?? 0, 'for', q)
        setSuggestions(data.suggestions ?? [])
        setOpen((data.suggestions?.length ?? 0) > 0)
      } catch (e) {
        console.error('[PlaceAutocomplete] fetch failed', e)
        setSuggestions([])
      }
    }, 280)
  }

  async function pick(suggestion) {
    // Retrieve full details (including coordinates) for the selected suggestion
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}` +
        `?access_token=${TOKEN}` +
        `&session_token=${sessionRef.current}`
      )
      const data = await res.json()
      const feature = data.features?.[0]
      if (feature) {
        const [lon, lat] = feature.geometry.coordinates
        const addr = feature.properties?.full_address ?? suggestion.full_address ?? suggestion.name
        onChange(addr)
        onSelect({ lat, lon })
        // Reset session token after a completed search
        sessionRef.current = makeSessionToken()
      }
    } catch {
      // Fallback: just set the name without coords (geocoding chain will handle it)
      onChange(suggestion.full_address ?? suggestion.name)
      onSelect(null)
    }
    setSuggestions([])
    setOpen(false)
    setActiveIdx(-1)
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="place-autocomplete" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />
      {open && suggestions.length > 0 && (
        <ul className="place-suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.mapbox_id}
              role="option"
              aria-selected={i === activeIdx}
              className={`place-suggestion-item${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="place-suggestion-name">{s.name}</span>
              {s.full_address && (
                <span className="place-suggestion-context">{s.full_address}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
