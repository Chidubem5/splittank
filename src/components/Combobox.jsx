import { useState, useRef, useEffect } from 'react'

export default function Combobox({ options, value, onChange, placeholder, disabled }) {
  const [open, setOpen]           = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef  = useRef(null)
  const prevDisabled  = useRef(disabled)

  const filtered = options.filter(o =>
    o.toString().toLowerCase().includes(value.toString().toLowerCase())
  )

  // Auto-open when disabled transitions true→false (e.g. models finish loading
  // while the input already has focus from the previous field's selection).
  useEffect(() => {
    if (prevDisabled.current && !disabled && options.length > 0) {
      setOpen(true)
    }
    prevDisabled.current = disabled
  }, [disabled, options])

  useEffect(() => {
    function onOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  function handleChange(e) {
    onChange(e.target.value)
    setOpen(true)
    setHighlighted(-1)
  }

  function handleSelect(option) {
    onChange(option)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); setHighlighted(0) }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && filtered.length > 0 && !disabled

  return (
    <div className="combobox" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => { if (!disabled) setOpen(true) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {showDropdown && (
        <ul className="combobox-list" role="listbox">
          {filtered.map((option, i) => (
            <li
              key={option}
              role="option"
              className={`combobox-option${i === highlighted ? ' highlighted' : ''}`}
              onMouseDown={() => handleSelect(option)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
