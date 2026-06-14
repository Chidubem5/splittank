import { useState, useRef, useEffect } from 'react'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function PlaceAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [open,        setOpen]        = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const debounceRef   = useRef(null)
  const containerRef  = useRef(null)

  // Close dropdown when clicking outside
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
    onSelect(null)      // clear stored coords so fetchRoute re-geocodes if needed
    setActiveIdx(-1)

    if (!TOKEN || q.length < 2) { setSuggestions([]); setOpen(false); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?access_token=${TOKEN}&autocomplete=true&types=address,poi,place,locality,neighborhood&limit=6`
        )
        const data = await res.json()
        setSuggestions(data.features ?? [])
        setOpen((data.features?.length ?? 0) > 0)
      } catch {
        setSuggestions([])
      }
    }, 280)
  }

  function pick(feature) {
    const [lon, lat] = feature.geometry.coordinates
    onChange(feature.place_name)
    onSelect({ lat, lon })
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
          {suggestions.map((f, i) => {
            const context = f.place_name.startsWith(f.text)
              ? f.place_name.slice(f.text.length).replace(/^,\s*/, '')
              : f.place_name
            return (
              <li
                key={f.id}
                role="option"
                aria-selected={i === activeIdx}
                className={`place-suggestion-item${i === activeIdx ? ' active' : ''}`}
                onMouseDown={() => pick(f)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className="place-suggestion-name">{f.text}</span>
                {context && <span className="place-suggestion-context">{context}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
