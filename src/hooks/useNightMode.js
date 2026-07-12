import { useState, useEffect } from 'react'

// Night mode window: 7pm–6am. Matches the boundary GasPriceMap.jsx and
// ElectricityRateMap.jsx already used independently for their inline SVG
// colors — this hook is now the single source of truth both read from.
function isNightNow() {
  const hour = new Date().getHours()
  return hour >= 19 || hour < 6
}

// Applies the night theme automatically by setting data-theme on <html>, so
// the CSS custom property overrides in App.css cascade to every element —
// including <body>, which sits above the app's own root div in the DOM.
// Re-checks every minute so a page left open across the 6am/7pm boundary
// switches without a reload.
export function useNightMode() {
  const [isNight, setIsNight] = useState(isNightNow)

  useEffect(() => {
    const id = setInterval(() => setIsNight(isNightNow()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isNight ? 'dark' : 'light')
  }, [isNight])

  return isNight
}
