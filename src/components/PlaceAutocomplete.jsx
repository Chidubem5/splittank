import { useState, useRef, useEffect } from 'react'
import { expandAcronym } from '../data/acronyms'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function makeSessionToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export default function PlaceAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [open,        setOpen]        = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const debounceRef  = useRef(null)
  const containerRef = useRef(null)
  const sessionRef   = useRef(makeSessionToken())

  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [])

  // Single Mapbox suggest call. Returns filtered suggestions array (empty on error).
  async function fetchOnce(searchQuery, limit = 5) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest` +
        `?q=${encodeURIComponent(searchQuery)}` +
        `&access_token=${TOKEN}` +
        `&session_token=${sessionRef.current}` +
        `&types=address,poi,place,locality,neighborhood,postcode` +
        `&proximity=ip` +
        `&limit=${limit}` +
        `&language=en`
      )
      if (!res.ok) return []
      const data = await res.json()
      // Filter out Airbnb/VRBO rental noise — real places have at least one poi_category
      return (data.suggestions ?? []).filter(s =>
        s.poi_category === null || s.poi_category === undefined || s.poi_category.length > 0
      )
    } catch {
      return []
    }
  }

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
      const expanded = expandAcronym(q) ?? q

      let results
      if (Array.isArray(expanded)) {
        // Ambiguous acronym (e.g. BC → Boston College | Bates | Babson)
        // Run one search per possible meaning, take top 2 each, deduplicate
        const arrays = await Promise.all(expanded.map(term => fetchOnce(term, 2)))
        const seen = new Set()
        results = arrays.flat().filter(s => {
          if (seen.has(s.mapbox_id)) return false
          seen.add(s.mapbox_id)
          return true
        })
      } else {
        results = await fetchOnce(expanded)
      }

      if (results.length === 0) {
        console.warn('[PlaceAutocomplete] no suggestions for', q, '→', expanded)
      }
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 280)
  }

  async function pick(suggestion) {
    setSuggestions([])
    setOpen(false)
    setActiveIdx(-1)
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
        sessionRef.current = makeSessionToken()
      }
    } catch {
      onChange(suggestion.full_address ?? suggestion.name)
      onSelect(null)
    }
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]) }
    if (e.key === 'Escape') setOpen(false)
  }

  function handleFocus() {
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 350)
  }

  return (
    <div className="place-autocomplete" ref={containerRef}>
      <input
        type="text"
        inputMode="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
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
              onPointerDown={e => { e.preventDefault(); pick(s) }}
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
