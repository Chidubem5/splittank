function CarpoolScene() {
  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0288D1" />
          <stop offset="100%" stopColor="#81D4FA" />
        </linearGradient>
        <linearGradient id="cRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#757575" />
          <stop offset="100%" stopColor="#616161" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="132" fill="url(#cSky)" />

      {/* Distant hills */}
      <ellipse cx="40"  cy="132" rx="60"  ry="22" fill="#4CAF50" opacity="0.5" />
      <ellipse cx="160" cy="132" rx="80"  ry="18" fill="#388E3C" opacity="0.45" />

      {/* Sun */}
      <circle cx="182" cy="32" r="22" fill="#FFD54F" />
      <circle cx="182" cy="32" r="15" fill="#FFF9C4" />

      {/* Cloud */}
      <g opacity="0.9">
        <ellipse cx="62"  cy="40" rx="32" ry="13" fill="white" />
        <ellipse cx="82"  cy="32" rx="24" ry="11" fill="white" />
        <ellipse cx="42"  cy="44" rx="20" ry="10" fill="white" />
      </g>
      <g opacity="0.7">
        <ellipse cx="130" cy="52" rx="20" ry="8" fill="white" />
        <ellipse cx="146" cy="47" rx="16" ry="7" fill="white" />
      </g>

      {/* Ground */}
      <rect y="132" width="220" height="68" fill="#8BC34A" />
      {/* Road */}
      <rect y="144" width="220" height="56" fill="url(#cRoad)" />
      {/* Road edge lines */}
      <line x1="0" y1="145" x2="220" y2="145" stroke="#FFC107" strokeWidth="1.5" opacity="0.6" />
      <line x1="0" y1="199" x2="220" y2="199" stroke="#FFC107" strokeWidth="1.5" opacity="0.6" />
      {/* Dashes */}
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={i * 52 - 4} y="170" width="32" height="5" rx="2" fill="#FFC107" opacity="0.8" />
      ))}

      {/* Car shadow */}
      <ellipse cx="110" cy="148" rx="88" ry="6" fill="#333" opacity="0.18" />

      {/* Car body */}
      <rect x="18" y="120" width="186" height="26" rx="6"
            fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="1.5" />

      {/* Cabin */}
      <path d="M 46,120 L 52,96 L 166,96 L 182,120 Z"
            fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1.5" />

      {/* B-pillar */}
      <rect x="104" y="96" width="5" height="24" fill="#BDBDBD" />

      {/* Rear window */}
      <path d="M 54,118 L 56,98 L 100,98 L 100,118 Z"
            fill="#90CAF9" opacity="0.55" stroke="#90CAF9" strokeWidth="0.5" />
      {/* Front window */}
      <path d="M 113,118 L 113,98 L 163,98 L 178,118 Z"
            fill="#90CAF9" opacity="0.55" stroke="#90CAF9" strokeWidth="0.5" />

      {/* Seat backs (visible through windows) */}
      <rect x="61"  y="110" width="4" height="10" rx="1" fill="#BDBDBD" opacity="0.6" />
      <rect x="84"  y="110" width="4" height="10" rx="1" fill="#BDBDBD" opacity="0.6" />
      <rect x="123" y="110" width="4" height="10" rx="1" fill="#BDBDBD" opacity="0.6" />
      <rect x="147" y="110" width="4" height="10" rx="1" fill="#BDBDBD" opacity="0.6" />

      {/* Passengers — rear */}
      {[
        { cx: 70,  cy: 109, color: '#FFC107' },
        { cx: 90,  cy: 109, color: '#EF9A9A' },
      ].map(({ cx, cy, color }) => (
        <g key={cx}>
          {/* Shoulder hint */}
          <rect x={cx - 8} y={cy + 8} width={16} height={8} rx="3" fill={color} opacity="0.75" />
          {/* Head */}
          <circle cx={cx} cy={cy} r={9} fill={color} />
          <circle cx={cx - 3} cy={cy - 2} r={1.6} fill="#1A1A1A" />
          <circle cx={cx + 3} cy={cy - 2} r={1.6} fill="#1A1A1A" />
          <path d={`M ${cx-3},${cy+3} Q ${cx},${cy+6} ${cx+3},${cy+3}`}
                stroke="#1A1A1A" strokeWidth="1.4" fill="none" />
        </g>
      ))}

      {/* Front passengers */}
      {[
        { cx: 128, cy: 109, color: '#A5D6A7' },
      ].map(({ cx, cy, color }) => (
        <g key={cx}>
          <rect x={cx - 8} y={cy + 8} width={16} height={8} rx="3" fill={color} opacity="0.75" />
          <circle cx={cx} cy={cy} r={9} fill={color} />
          <circle cx={cx - 3} cy={cy - 2} r={1.6} fill="#1A1A1A" />
          <circle cx={cx + 3} cy={cy - 2} r={1.6} fill="#1A1A1A" />
          <path d={`M ${cx-3},${cy+3} Q ${cx},${cy+6} ${cx+3},${cy+3}`}
                stroke="#1A1A1A" strokeWidth="1.4" fill="none" />
        </g>
      ))}

      {/* Driver */}
      <g>
        <rect x={144} y={117} width={16} height={8} rx="3" fill="#29B6F6" opacity="0.75" />
        <circle cx={152} cy={109} r={9} fill="#29B6F6" />
        <circle cx={149} cy={107} r={1.6} fill="#1A1A1A" />
        <circle cx={155} cy={107} r={1.6} fill="#1A1A1A" />
        {/* Steering wheel */}
        <circle cx={145} cy={121} r={7} fill="none" stroke="#9E9E9E" strokeWidth="2" />
        <line x1={145} y1={114} x2={145} y2={128} stroke="#9E9E9E" strokeWidth="1.5" />
        <line x1={138} y1={121} x2={152} y2={121} stroke="#9E9E9E" strokeWidth="1.5" />
      </g>

      {/* Headlight */}
      <rect x="202" y="124" width="7" height="9" rx="2"
            fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
      {/* Taillight */}
      <rect x="12" y="124" width="7" height="9" rx="2" fill="#EF9A9A" />
      {/* Side trim line */}
      <line x1="22" y1="133" x2="200" y2="133" stroke="#BDBDBD" strokeWidth="1" opacity="0.7" />

      {/* Wheels */}
      {[60, 163].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy={147} r={19} fill="#1A1A1A" />
          <circle cx={cx} cy={147} r={13} fill="#2E2E2E" />
          <circle cx={cx} cy={147} r={6}  fill="#8A8A8A" />
          {[0,72,144,216,288].map(a => {
            const rad = a * Math.PI / 180
            return (
              <line key={a}
                x1={cx + 6  * Math.cos(rad)} y1={147 + 6  * Math.sin(rad)}
                x2={cx + 13 * Math.cos(rad)} y2={147 + 13 * Math.sin(rad)}
                stroke="#8A8A8A" strokeWidth="2.2" strokeLinecap="round"
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

function GasPriceScene() {
  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#FFF8E1" />
        </linearGradient>
        <linearGradient id="gPump" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#607D8B" />
          <stop offset="100%" stopColor="#455A64" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="220" height="200" fill="url(#gBg)" />

      {/* Large $ watermark */}
      <text x="110" y="138" textAnchor="middle" fontSize="170" fontWeight="900"
            fill="#FFC107" opacity="0.08">$</text>

      {/* Pump body */}
      <rect x="58" y="38" width="72" height="116" rx="8" fill="url(#gPump)" />
      {/* Pump highlight */}
      <rect x="61" y="41" width="8" height="110" rx="4" fill="white" opacity="0.06" />
      {/* Top cap */}
      <rect x="55" y="32" width="78" height="12" rx="4" fill="#37474F" />

      {/* Price display panel */}
      <rect x="68" y="52" width="52" height="44" rx="5" fill="#0D0D0D" />
      <rect x="71" y="55" width="46" height="16" rx="2" fill="#0A0A0A" />
      <text x="94" y="67" textAnchor="middle" fontSize="10" fontWeight="900"
            fill="#FF1744" letterSpacing="0.5">$4.99</text>
      <text x="94" y="78" textAnchor="middle" fontSize="6" fontWeight="600"
            fill="#78909C">/gallon</text>
      {/* Keypad dots */}
      {[0,1,2].map(col => [0,1,2].map(row => (
        <circle key={`${col}-${row}`}
          cx={77 + col * 12} cy={102 + row * 9} r="3" fill="#546E7A" />
      )))}

      {/* Nozzle hook + hose */}
      <rect x="130" y="74" width="24" height="7" rx="3.5" fill="#78909C" />
      <rect x="150" y="68" width="7" height="18" rx="3" fill="#607D8B" />
      <path d="M 130 77 Q 162 95 156 122"
            stroke="#37474F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 130 77 Q 162 95 156 122"
            stroke="#546E7A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 4" />
      <rect x="149" y="119" width="13" height="8" rx="2.5" fill="#263238" />

      {/* Rising price arrows */}
      {[
        { x: 152, topY: 44, botY: 60 },
        { x: 167, topY: 36, botY: 54 },
        { x: 182, topY: 46, botY: 64 },
      ].map(({ x, topY, botY }) => (
        <g key={x}>
          <polygon points={`${x-5},${topY+9} ${x+5},${topY+9} ${x},${topY}`} fill="#FF1744" />
          <line x1={x} y1={topY + 9} x2={x} y2={botY}
                stroke="#FF1744" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      {/* Shocked face */}
      <circle cx="94" cy="126" r="16" fill="#FFC107" stroke="#F9A825" strokeWidth="1.5" />
      {/* Eyes — wide open */}
      <circle cx="88" cy="122" r="3.5" fill="white" />
      <circle cx="100" cy="122" r="3.5" fill="white" />
      <circle cx="88" cy="122" r="2" fill="#1A1A1A" />
      <circle cx="100" cy="122" r="2" fill="#1A1A1A" />
      {/* Open mouth */}
      <ellipse cx="94" cy="132" rx="4.5" ry="5" fill="none"
               stroke="#1A1A1A" strokeWidth="1.8" />
      {/* Eyebrows raised */}
      <path d="M 84,118 Q 88,115 92,118" stroke="#1A1A1A" strokeWidth="1.5"
            fill="none" strokeLinecap="round" />
      <path d="M 96,118 Q 100,115 104,118" stroke="#1A1A1A" strokeWidth="1.5"
            fill="none" strokeLinecap="round" />
      {/* Sweat drop */}
      <path d="M 107,114 L 103,123 Q 108,126 112,122 Z" fill="#81D4FA" opacity="0.85" />

      {/* Ground + pump base */}
      <rect y="162" width="220" height="38" fill="#BDBDBD" />
      <rect x="50" y="150" width="88" height="14" rx="5" fill="#37474F" />
    </svg>
  )
}

function FunTripScene() {
  const spokeAngles = [0, 72, 144, 216, 288]
  const CAR_TOP = 128

  const friends = [
    { cx: 56,  cy: 82, color: '#FFC107', lArmDx: -26, lArmDy: -20, rArmDx: 26, rArmDy: -18 },
    { cx: 110, cy: 78, color: '#29B6F6', lArmDx: -24, lArmDy: -22, rArmDx: 24, rArmDy: -22 },
    { cx: 162, cy: 82, color: '#A5D6A7', lArmDx: -22, lArmDy: -18, rArmDx: 22, rArmDy: -20 },
  ]

  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0277BD" />
          <stop offset="100%" stopColor="#4FC3F7" />
        </linearGradient>
        <linearGradient id="fCar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD740" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="140" fill="url(#fSky)" />

      {/* Hills */}
      <ellipse cx="30"  cy="140" rx="55" ry="20" fill="#4CAF50" opacity="0.45" />
      <ellipse cx="190" cy="140" rx="60" ry="16" fill="#388E3C" opacity="0.4" />

      {/* Sun + rays */}
      <circle cx="186" cy="30" r="24" fill="#FFD740" />
      <circle cx="186" cy="30" r="16" fill="#FFF9C4" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = a * Math.PI / 180
        return (
          <line key={a}
            x1={186 + 22 * Math.cos(r)} y1={30 + 22 * Math.sin(r)}
            x2={186 + 32 * Math.cos(r)} y2={30 + 32 * Math.sin(r)}
            stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"
          />
        )
      })}

      {/* Stars / confetti */}
      {[
        { x: 16,  y: 28,  s: 12, c: '#FFC107' },
        { x: 50,  y: 15,  s: 9,  c: 'white'   },
        { x: 82,  y: 38,  s: 14, c: '#FFC107' },
        { x: 114, y: 18,  s: 9,  c: 'white'   },
        { x: 146, y: 34,  s: 11, c: '#FFD740' },
      ].map(({ x, y, s, c }) => (
        <text key={x} x={x} y={y} fontSize={s} fill={c} opacity="0.9">★</text>
      ))}

      {/* Ground + road */}
      <rect y="140" width="220" height="60" fill="#8BC34A" />
      <rect y="150" width="220" height="50" fill="#757575" />
      <line x1="0" y1="151" x2="220" y2="151" stroke="#FFC107" strokeWidth="1.5" opacity="0.5" />
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={i * 52 - 4} y="174" width="32" height="5" rx="2"
              fill="#FFC107" opacity="0.85" />
      ))}

      {/* Car shadow */}
      <ellipse cx="110" cy="153" rx="90" ry="5" fill="#333" opacity="0.2" />

      {/* Convertible car body */}
      <rect x="16" y={CAR_TOP} width="188" height="24" rx="6"
            fill="url(#fCar)" stroke="#F9A825" strokeWidth="1.5" />
      {/* Door lines */}
      <line x1="90" y1={CAR_TOP} x2="90" y2={CAR_TOP + 24}
            stroke="#F9A825" strokeWidth="1.2" opacity="0.6" />
      <line x1="140" y1={CAR_TOP} x2="140" y2={CAR_TOP + 24}
            stroke="#F9A825" strokeWidth="1.2" opacity="0.6" />
      {/* Interior / seats visible */}
      <rect x="22" y={CAR_TOP + 2} width="170" height={20} rx="4"
            fill="#F9A825" opacity="0.25" />

      {/* Windshield */}
      <path d={`M 156,${CAR_TOP} L 166,108 L 198,108 L 198,${CAR_TOP} Z`}
            fill="#81D4FA" opacity="0.55" stroke="#D8D8D8" strokeWidth="1" />
      {/* Front bumper */}
      <rect x="198" y={CAR_TOP} width="9" height="24" rx="3" fill="#F9A825" />
      {/* Rear bumper */}
      <rect x="13"  y={CAR_TOP} width="6" height="24" rx="2" fill="#F9A825" />
      {/* Headlight */}
      <rect x="203" y={CAR_TOP + 4} width="7" height="10" rx="2"
            fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
      {/* Taillight */}
      <rect x="14"  y={CAR_TOP + 4} width="6" height="10" rx="1" fill="#EF9A9A" />

      {/* Friends with full upper bodies */}
      {friends.map(({ cx, cy, color, lArmDx, lArmDy, rArmDx, rArmDy }) => {
        const shoulderY = cy + 14
        const torsoH = CAR_TOP - shoulderY + 2
        return (
          <g key={cx}>
            {/* Torso */}
            <rect x={cx - 11} y={shoulderY} width={22} height={torsoH}
                  rx="5" fill={color} />
            {/* Head */}
            <circle cx={cx} cy={cy} r={13} fill={color} />
            {/* Eyes */}
            <circle cx={cx - 4} cy={cy - 3} r={2.2} fill="#1A1A1A" />
            <circle cx={cx + 4} cy={cy - 3} r={2.2} fill="#1A1A1A" />
            {/* Smile */}
            <path d={`M ${cx-5},${cy+4} Q ${cx},${cy+9} ${cx+5},${cy+4}`}
                  stroke="#1A1A1A" strokeWidth="1.8" fill="none" />
            {/* Left arm raised from shoulder */}
            <line x1={cx - 11} y1={shoulderY + 5}
                  x2={cx + lArmDx} y2={shoulderY + 5 + lArmDy}
                  stroke={color} strokeWidth="6" strokeLinecap="round" />
            {/* Right arm raised from shoulder */}
            <line x1={cx + 11} y1={shoulderY + 5}
                  x2={cx + rArmDx} y2={shoulderY + 5 + rArmDy}
                  stroke={color} strokeWidth="6" strokeLinecap="round" />
          </g>
        )
      })}

      {/* Wheels */}
      {[60, 163].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy={154} r={21} fill="#1A1A1A" />
          <circle cx={cx} cy={154} r={14} fill="#2E2E2E" />
          <circle cx={cx} cy={154} r={6}  fill="#9E9E9E" />
          {spokeAngles.map(a => {
            const rad = a * Math.PI / 180
            return (
              <line key={a}
                x1={cx + 6  * Math.cos(rad)} y1={154 + 6  * Math.sin(rad)}
                x2={cx + 14 * Math.cos(rad)} y2={154 + 14 * Math.sin(rad)}
                stroke="#8A8A8A" strokeWidth="2.2" strokeLinecap="round"
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

const PANELS = [
  {
    Scene: CarpoolScene,
    quote: 'Carpooling has never been easier',
    accent: '#E3F2FD',
    border: '#4FC3F7',
  },
  {
    Scene: GasPriceScene,
    quote: "Gas isn't cheap!",
    accent: '#FFF8E1',
    border: '#FFC107',
  },
  {
    Scene: FunTripScene,
    quote: "Don't let money get in the way of a fun time",
    accent: '#E8F5E9',
    border: '#A5D6A7',
  },
]

export default function RoadGallery() {
  return (
    <section className="road-gallery">
      <div className="road-gallery-inner">
        {PANELS.map(({ Scene, quote, accent, border }) => (
          <div
            className="gallery-panel"
            key={quote}
            style={{ '--panel-accent': accent, '--panel-border': border }}
          >
            <div className="gallery-scene">
              <Scene />
            </div>
            <div className="gallery-quote">
              <span className="gallery-quote-mark">"</span>
              <p>{quote}</p>
              <span className="gallery-quote-mark gallery-quote-mark--close">"</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
