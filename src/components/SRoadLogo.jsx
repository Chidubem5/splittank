// SRoadLogo.jsx — the Split Tank "S Road" mark: a winding road that forms an
// S, with yellow centre dashes and a yellow fuel stop, on a green tile.
// Same artwork as public/favicon.svg and the app icons (logo-*.png).

export default function SRoadLogo({ size = 40, className }) {
  const road = 'M74 16 C44 12 24 24 30 40 S72 54 70 70 S46 88 24 84'
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" rx="22" fill="#43A047" />
      <path d={road} fill="none" stroke="#1A1A2E" strokeWidth="26" strokeLinecap="round" />
      <path d={road} fill="none" stroke="#5A5F6B" strokeWidth="19" strokeLinecap="round" />
      <path d={road} fill="none" stroke="#FFC107" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
      <circle cx="80" cy="44" r="7" fill="#FFC107" stroke="#1A1A2E" strokeWidth="3" />
    </svg>
  )
}
