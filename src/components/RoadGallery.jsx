import { RoadHeroSVG } from './RoadHero'

/* Reusable wheel */
function Wheel({ cx, cy, r = 18 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}     fill="#1C1C1E" />
      <circle cx={cx} cy={cy} r={r - 5} fill="#2C2C2E" />
      <circle cx={cx} cy={cy} r={5}     fill="#8E8E93" />
      {[0,72,144,216,288].map(a => {
        const rad = a * Math.PI / 180
        return (
          <line key={a}
            x1={cx + 5  * Math.cos(rad)} y1={cy + 5  * Math.sin(rad)}
            x2={cx + (r-5) * Math.cos(rad)} y2={cy + (r-5) * Math.sin(rad)}
            stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

/* Simple smiley head — emoji-style circle, no body */
function Head({ cx, cy, r = 10, color, happy = true }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx - r*0.28} cy={cy - r*0.15} r={r*0.16} fill="#1C1C1E" />
      <circle cx={cx + r*0.28} cy={cy - r*0.15} r={r*0.16} fill="#1C1C1E" />
      {happy
        ? <path d={`M ${cx - r*0.3},${cy + r*0.2} Q ${cx},${cy + r*0.5} ${cx + r*0.3},${cy + r*0.2}`}
                stroke="#1C1C1E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        : <path d={`M ${cx - r*0.3},${cy + r*0.4} Q ${cx},${cy + r*0.15} ${cx + r*0.3},${cy + r*0.4}`}
                stroke="#1C1C1E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      }
    </g>
  )
}

/* Sky + road background shared helper */
function SceneBg({ skyTop = '#0288D1', skyBot = '#4FC3F7', roadY = 138 }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky_${skyTop.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
      </defs>
      <rect width="220" height={roadY} fill={`url(#sky_${skyTop.slice(1)})`} />
      <ellipse cx="40"  cy={roadY} rx="55"  ry="18" fill="#4CAF50" opacity="0.5" />
      <ellipse cx="175" cy={roadY} rx="65"  ry="15" fill="#388E3C" opacity="0.4" />
      <rect y={roadY}      width="220" height={200 - roadY} fill="#757575" />
      <rect y={roadY}      width="220" height="3"            fill="#616161" />
      {[0,1,2,3].map(i => (
        <rect key={i} x={i * 58 - 4} y={roadY + (200 - roadY) / 2 - 3}
              width="34" height="5" rx="2" fill="#FFC107" opacity="0.7" />
      ))}
    </>
  )
}

/* ── Scene 1: Carpool — white sedan with 4 passengers ── */
function CarpoolScene() {
  const roadY   = 136
  const groundY = 158
  const bodyY   = 116
  const roofY   = 94
  const winY    = roofY + 5

  const heads = [
    { cx: 72,  cy: winY + 11, color: '#FFC107' },
    { cx: 92,  cy: winY + 11, color: '#F48FB1' },
    { cx: 125, cy: winY + 11, color: '#A5D6A7' },
    { cx: 148, cy: winY + 11, color: '#29B6F6' },
  ]

  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <SceneBg roadY={roadY} />
      {/* Sun */}
      <circle cx="182" cy="30" r="20" fill="#FFD54F" />
      <circle cx="182" cy="30" r="13" fill="#FFF9C4" />
      {/* Cloud */}
      <g opacity="0.88">
        <ellipse cx="62" cy="38" rx="30" ry="12" fill="white" />
        <ellipse cx="80" cy="30" rx="22" ry="10" fill="white" />
      </g>

      {/* Shadow */}
      <ellipse cx="110" cy={groundY + 2} rx="85" ry="5" fill="black" opacity="0.14" />

      {/* HEADS first — visible through windows */}
      {heads.map(h => <Head key={h.cx} cx={h.cx} cy={h.cy} r={10} color={h.color} />)}
      {/* Steering wheel hint */}
      <circle cx="140" cy={winY + 22} r="6" fill="none" stroke="#9E9E9E" strokeWidth="1.8" />
      <line x1="140" y1={winY + 16} x2="140" y2={winY + 28} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="134" y1={winY + 22} x2="146" y2={winY + 22} stroke="#9E9E9E" strokeWidth="1.5" />

      {/* CAR BODY — drawn after heads */}
      {/* Lower body */}
      <rect x="18" y={bodyY} width="186" height="24" rx="6" fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="1.5" />
      {/* Roof */}
      <rect x="50"  y={roofY}     width="120" height="5" rx="2" fill="#E0E0E0" />
      {/* C-pillar */}
      <path d={`M 44,${bodyY} L 52,${roofY} L 58,${roofY} L 50,${bodyY} Z`} fill="#DCDCDC" />
      {/* B-pillar */}
      <rect x="103" y={roofY} width="5" height={bodyY - roofY} fill="#BDBDBD" />
      {/* A-pillar */}
      <path d={`M 162,${roofY} L 180,${bodyY} L 174,${bodyY} L 158,${roofY} Z`} fill="#DCDCDC" />
      {/* Taillights */}
      <rect x="12"  y={bodyY + 4} width="8" height="11" rx="2" fill="#EF9A9A" />
      {/* Headlights */}
      <rect x="202" y={bodyY + 4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />

      {/* WINDOW GLASS — very light tint, drawn last */}
      <path d={`M 52,${bodyY - 1} L 54,${roofY + 3} L 100,${roofY + 3} L 100,${bodyY - 1} Z`}
            fill="#81D4FA" opacity="0.2" />
      <path d={`M 112,${bodyY - 1} L 112,${roofY + 3} L 162,${roofY + 3} L 177,${bodyY - 1} Z`}
            fill="#81D4FA" opacity="0.2" />

      <Wheel cx={60}  cy={groundY} r={18} />
      <Wheel cx={162} cy={groundY} r={18} />
    </svg>
  )
}

/* ── Scene 2: Gas Price — pump with rising prices ── */
function GasPriceScene() {
  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#FFF8E1" />
        </linearGradient>
        <linearGradient id="gPump" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#546E7A" />
          <stop offset="100%" stopColor="#37474F" />
        </linearGradient>
      </defs>

      <rect width="220" height="200" fill="url(#gBg)" />
      {/* Giant $ watermark */}
      <text x="110" y="145" textAnchor="middle" fontSize="160" fontWeight="900"
            fill="#FFC107" opacity="0.07">$</text>

      {/* Pump body */}
      <rect x="62" y="42" width="68" height="108" rx="8" fill="url(#gPump)" />
      <rect x="57" y="36" width="78" height="12" rx="4" fill="#263238" />
      {/* Highlight */}
      <rect x="65" y="46" width="7" height="100" rx="3" fill="white" opacity="0.06" />

      {/* Price display */}
      <rect x="70" y="56" width="48" height="40" rx="5" fill="#0D0D0D" />
      <text x="94" y="72" textAnchor="middle" fontSize="9" fontWeight="900"
            fill="#FF1744" letterSpacing="1">$4.85</text>
      <text x="94" y="82" textAnchor="middle" fontSize="6"
            fill="#78909C">/gallon</text>
      <text x="94" y="92" textAnchor="middle" fontSize="7" fontWeight="700"
            fill="#FF5252" opacity="0.85">↑ UP 12¢</text>

      {/* Keypad */}
      {[0,1,2].map(col => [0,1,2].map(row => (
        <circle key={`${col}-${row}`}
          cx={76 + col*11} cy={108 + row*9} r="3" fill="#455A64" />
      )))}

      {/* Hose */}
      <rect x="130" y="76" width="22" height="6" rx="3" fill="#78909C" />
      <rect x="148" y="70" width="6" height="16" rx="3" fill="#607D8B" />
      <path d="M 130 79 Q 160 96 154 122"
            stroke="#263238" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 130 79 Q 160 96 154 122"
            stroke="#546E7A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 4" />
      <rect x="147" y="120" width="12" height="8" rx="2" fill="#1C1C1E" />

      {/* Rising arrows */}
      {[{ x:154,t:44 }, { x:168,t:36 }, { x:182,t:46 }].map(({ x, t }) => (
        <g key={x}>
          <polygon points={`${x-5},${t+9} ${x+5},${t+9} ${x},${t}`} fill="#FF1744" />
          <line x1={x} y1={t+9} x2={x} y2={t+20}
                stroke="#FF1744" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      {/* Shocked face */}
      <Head cx={94} cy={134} r={16} color="#FFC107" happy={false} />

      {/* Ground */}
      <rect y="162" width="220" height="38" fill="#BDBDBD" />
      <rect x="52"  y="150"  width="88" height="14" rx="5" fill="#263238" />
    </svg>
  )
}

/* ── Scene 3: Fun Trip — yellow SUV with 3 smiling passengers ── */
function FunTripScene() {
  const roadY   = 140
  const groundY = 155
  const CAR_TOP = 128
  const roofY   = CAR_TOP - 32

  const headColors = ['#FF7043', '#EF5350', '#A5D6A7']
  const headXs     = [57, 111, 158]

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

      <rect width="220" height={roadY} fill="url(#fSky)" />
      <ellipse cx="30"  cy={roadY} rx="52" ry="18" fill="#4CAF50" opacity="0.45" />
      <ellipse cx="192" cy={roadY} rx="58" ry="14" fill="#388E3C" opacity="0.4" />
      <rect y={roadY}      width="220" height={200 - roadY} fill="#757575" />
      <rect y={roadY}      width="220" height="3"           fill="#616161" />
      {[0,1,2,3].map(i => (
        <rect key={i} x={i * 58 - 4} y={roadY + 14} width="34" height="5" rx="2"
              fill="#FFC107" opacity="0.75" />
      ))}

      {/* Sun + rays */}
      <circle cx="184" cy="28" r="22" fill="#FFD740" />
      <circle cx="184" cy="28" r="14" fill="#FFF9C4" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = a * Math.PI / 180
        return (
          <line key={a}
            x1={184 + 20*Math.cos(r)} y1={28 + 20*Math.sin(r)}
            x2={184 + 29*Math.cos(r)} y2={28 + 29*Math.sin(r)}
            stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"
          />
        )
      })}

      {/* Stars */}
      {[{x:18,y:28},{x:52,y:16},{x:84,y:40},{x:118,y:20},{x:148,y:36}].map(({x,y},i) => (
        <text key={i} x={x} y={y} fontSize={i%2?9:12} fill={i%2?"white":"#FFC107"} opacity="0.9">★</text>
      ))}

      {/* Shadow */}
      <ellipse cx="110" cy={groundY + 2} rx="92" ry="5" fill="black" opacity="0.18" />

      {/* HEADS — drawn before car body */}
      {headXs.map((cx, i) => (
        <Head key={cx} cx={cx} cy={roofY + 11} r={11} color={headColors[i]} />
      ))}
      {/* Steering wheel */}
      <circle cx="150" cy={CAR_TOP - 4} r="8" fill="none" stroke="#9E9E9E" strokeWidth="2" />
      <line x1="150" y1={CAR_TOP - 12} x2="150" y2={CAR_TOP + 4} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="142" y1={CAR_TOP - 4} x2="158" y2={CAR_TOP - 4} stroke="#9E9E9E" strokeWidth="1.5" />

      {/* CAR BODY on top */}
      <rect x="8"  y={CAR_TOP} width="204" height="26" rx="5" fill="url(#fCar)" stroke="#F9A825" strokeWidth="2" />
      {/* C-pillar */}
      <path d={`M 18,${CAR_TOP} L 28,${roofY} L 36,${roofY} L 26,${CAR_TOP} Z`} fill="#F9A825" />
      {/* Roof bar */}
      <rect x="28" y={roofY} width="162" height="5" rx="2" fill="#F9A825" />
      {/* B-pillar */}
      <rect x="90" y={roofY} width="6" height={CAR_TOP - roofY} fill="#F9A825" />
      {/* A-pillar */}
      <path d={`M 180,${roofY} L 202,${CAR_TOP} L 194,${CAR_TOP} L 176,${roofY} Z`} fill="#F9A825" />
      {/* Door details */}
      <line x1="90" y1={CAR_TOP} x2="90" y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      <line x1="150" y1={CAR_TOP} x2="150" y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      {/* Lights */}
      <rect x="202" y={CAR_TOP+4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
      <rect x="8"   y={CAR_TOP+4} width="8" height="11" rx="2" fill="#EF9A9A" />

      {/* WINDOW GLASS — last */}
      <rect x="37"  y={roofY+4} width="53" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.3" />
      <rect x="97"  y={roofY+4} width="79" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.3" />

      <Wheel cx={58}  cy={groundY} r={20} />
      <Wheel cx={163} cy={groundY} r={20} />
    </svg>
  )
}

const PANELS = [
  {
    Scene: CarpoolScene,
    quote: 'Carpool smarter — everyone pays their fair share',
    accent: '#E3F2FD',
    border: '#4FC3F7',
  },
  {
    Scene: GasPriceScene,
    quote: 'Live gas prices update daily so the math is always right',
    accent: '#FFF8E1',
    border: '#FFC107',
  },
  {
    Scene: FunTripScene,
    quote: "Don't let gas costs get in the way of a great trip",
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
            <div className="gallery-scene"><Scene /></div>
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
