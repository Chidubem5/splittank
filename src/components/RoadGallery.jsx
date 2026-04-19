import { RoadHeroSVG } from './RoadHero'

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

function Head({ cx, cy, r = 10, skinTone = '#FFCE9F', hairColor = '#4E342E', happy = true, hasGlasses = false }) {
  return (
    <g>
      {/* Ears */}
      <ellipse cx={cx - r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />
      <ellipse cx={cx + r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />
      {/* Head */}
      <circle cx={cx} cy={cy} r={r} fill={skinTone} />
      {/* Hair */}
      <ellipse cx={cx} cy={cy - r * 0.45} rx={r * 0.85} ry={r * 0.65} fill={hairColor} />
      {/* Eye whites */}
      <ellipse cx={cx - r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />
      <ellipse cx={cx + r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />
      {/* Pupils */}
      <circle  cx={cx - r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />
      <circle  cx={cx + r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />
      {/* Eye shine */}
      <circle  cx={cx - r * 0.21} cy={cy - r * 0.17} r={r * 0.05} fill="white" />
      <circle  cx={cx + r * 0.35} cy={cy - r * 0.17} r={r * 0.05} fill="white" />
      {/* Glasses */}
      {hasGlasses && (
        <g stroke="#5D4037" strokeWidth={r * 0.1} fill="none" opacity="0.9">
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.1} rx={r * 0.23} ry={r * 0.21} />
          <ellipse cx={cx + r * 0.3} cy={cy - r * 0.1} rx={r * 0.23} ry={r * 0.21} />
          <line x1={cx - r*0.07} y1={cy - r*0.1} x2={cx + r*0.07} y2={cy - r*0.1} />
          <line x1={cx - r*0.53} y1={cy - r*0.1} x2={cx - r*0.67} y2={cy - r*0.06} />
          <line x1={cx + r*0.53} y1={cy - r*0.1} x2={cx + r*0.67} y2={cy - r*0.06} />
        </g>
      )}
      {/* Mouth */}
      {happy
        ? <path d={`M ${cx-r*0.32},${cy+r*0.27} Q ${cx},${cy+r*0.58} ${cx+r*0.32},${cy+r*0.27}`}
                stroke="#8B4513" strokeWidth={r*0.15} fill="none" strokeLinecap="round" />
        : <path d={`M ${cx-r*0.32},${cy+r*0.5} Q ${cx},${cy+r*0.27} ${cx+r*0.32},${cy+r*0.5}`}
                stroke="#8B4513" strokeWidth={r*0.15} fill="none" strokeLinecap="round" />
      }
    </g>
  )
}

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

/* ── Scene 1: Carpool — white sedan with 4 diverse passengers ── */
function CarpoolScene() {
  const roadY   = 136
  const groundY = 158
  const bodyY   = 116
  const roofY   = 94
  const winY    = roofY + 5

  const chars = [
    { cx: 72,  skinTone: '#FFCE9F', hairColor: '#1A1A1A' },
    { cx: 93,  skinTone: '#C8834A', hairColor: '#3E1F00' },
    { cx: 125, skinTone: '#FFCE9F', hairColor: '#C62828' },
    { cx: 148, skinTone: '#E8A87C', hairColor: '#1A1A1A', hasGlasses: true },
  ]
  const shirtColors = ['#1565C0', '#2E7D32', '#6A1B9A', '#E64A19']

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

      {/* Car shadow */}
      <ellipse cx="110" cy={groundY + 2} rx="85" ry="5" fill="black" opacity="0.14" />

      {/* Shirt hints at window sill — drawn before heads */}
      {chars.map((c, i) => (
        <rect key={i} x={c.cx - 11} y={bodyY - 3} width="22" height="10" rx="4"
              fill={shirtColors[i]} opacity="0.88" />
      ))}

      {/* HEADS first — visible through windows */}
      {chars.map((c, i) => (
        <Head key={i} cx={c.cx} cy={winY + 11} r={10}
              skinTone={c.skinTone} hairColor={c.hairColor}
              hasGlasses={c.hasGlasses} />
      ))}

      {/* Steering wheel hint */}
      <circle cx="140" cy={winY + 22} r="6" fill="none" stroke="#9E9E9E" strokeWidth="1.8" />
      <line x1="140" y1={winY+16} x2="140" y2={winY+28} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="134" y1={winY+22} x2="146" y2={winY+22} stroke="#9E9E9E" strokeWidth="1.5" />

      {/* CAR BODY — drawn after heads */}
      <rect x="18" y={bodyY} width="186" height="24" rx="6" fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="1.5" />
      {/* Roof */}
      <rect x="50"  y={roofY} width="120" height="5" rx="2" fill="#E0E0E0" />
      {/* C-pillar */}
      <path d={`M 44,${bodyY} L 52,${roofY} L 58,${roofY} L 50,${bodyY} Z`} fill="#DCDCDC" />
      {/* B-pillar */}
      <rect x="103" y={roofY} width="5" height={bodyY - roofY} fill="#BDBDBD" />
      {/* A-pillar */}
      <path d={`M 162,${roofY} L 180,${bodyY} L 174,${bodyY} L 158,${roofY} Z`} fill="#DCDCDC" />
      {/* Taillights */}
      <rect x="12"  y={bodyY+4} width="8" height="11" rx="2" fill="#EF9A9A" />
      {/* Headlights */}
      <rect x="202" y={bodyY+4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
      {/* Door handles */}
      <rect x="78"  y={bodyY+8} width="12" height="3" rx="1.5" fill="#C0C0C0" />
      <rect x="130" y={bodyY+8} width="14" height="3" rx="1.5" fill="#C0C0C0" />

      {/* WINDOW GLASS — very light tint, drawn last */}
      <path d={`M 52,${bodyY-1} L 54,${roofY+3} L 100,${roofY+3} L 100,${bodyY-1} Z`}
            fill="#81D4FA" opacity="0.22" />
      <path d={`M 112,${bodyY-1} L 112,${roofY+3} L 162,${roofY+3} L 177,${bodyY-1} Z`}
            fill="#81D4FA" opacity="0.22" />

      <Wheel cx={60}  cy={groundY} r={18} />
      <Wheel cx={162} cy={groundY} r={18} />
    </svg>
  )
}

/* ── Scene 2: Gas Price — shocked person next to pump ── */
function GasPriceScene() {
  const pX  = 162   // person cx
  const pHY = 118   // person head cy
  const hR  = 17    // head radius

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
      <text x="90" y="145" textAnchor="middle" fontSize="160" fontWeight="900"
            fill="#FFC107" opacity="0.07">$</text>

      {/* Pump body */}
      <rect x="28" y="42" width="68" height="108" rx="8" fill="url(#gPump)" />
      <rect x="23" y="36" width="78" height="12" rx="4" fill="#263238" />
      {/* Pump highlight */}
      <rect x="31" y="46" width="7" height="100" rx="3" fill="white" opacity="0.06" />

      {/* Price display */}
      <rect x="36" y="56" width="48" height="40" rx="5" fill="#0D0D0D" />
      <text x="60" y="72" textAnchor="middle" fontSize="9" fontWeight="900"
            fill="#FF1744" letterSpacing="1">$4.85</text>
      <text x="60" y="82" textAnchor="middle" fontSize="6"
            fill="#78909C">/gallon</text>
      <text x="60" y="92" textAnchor="middle" fontSize="7" fontWeight="700"
            fill="#FF5252" opacity="0.85">↑ UP 12¢</text>

      {/* Keypad */}
      {[0,1,2].map(col => [0,1,2].map(row => (
        <circle key={`${col}-${row}`}
          cx={42 + col*11} cy={108 + row*9} r="3" fill="#455A64" />
      )))}

      {/* Hose */}
      <rect x="96" y="76" width="22" height="6" rx="3" fill="#78909C" />
      <rect x="114" y="70" width="6" height="16" rx="3" fill="#607D8B" />
      <path d="M 96 79 Q 130 100 122 126"
            stroke="#263238" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 96 79 Q 130 100 122 126"
            stroke="#546E7A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 4" />
      <rect x="115" y="124" width="12" height="8" rx="2" fill="#1C1C1E" />

      {/* Rising arrows above pump */}
      {[{ x:34,t:26 }, { x:50,t:18 }, { x:66,t:28 }].map(({ x, t }) => (
        <g key={x}>
          <polygon points={`${x-5},${t+9} ${x+5},${t+9} ${x},${t}`} fill="#FF1744" />
          <line x1={x} y1={t+9} x2={x} y2={t+20}
                stroke="#FF1744" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      {/* Shocked person body — drawn before head */}
      {/* Shirt */}
      <rect x={pX-16} y={pHY+hR} width="32" height="26" rx="7" fill="#1565C0" />
      {/* Arms raised in shock */}
      <line x1={pX-14} y1={pHY+hR+8} x2={pX-34} y2={pHY-4}
            stroke="#E8A87C" strokeWidth="8" strokeLinecap="round" />
      <line x1={pX+14} y1={pHY+hR+8} x2={pX+34} y2={pHY-4}
            stroke="#E8A87C" strokeWidth="8" strokeLinecap="round" />
      {/* Hands */}
      <circle cx={pX-34} cy={pHY-4} r="6" fill="#E8A87C" />
      <circle cx={pX+34} cy={pHY-4} r="6" fill="#E8A87C" />

      {/* Head last — on top of body */}
      <Head cx={pX} cy={pHY} r={hR} skinTone="#E8A87C" hairColor="#5D4037" happy={false} />

      {/* Ground */}
      <rect y="162" width="220" height="38" fill="#BDBDBD" />
      <rect x="18"  y="148"  width="88" height="16" rx="5" fill="#263238" />
    </svg>
  )
}

/* ── Scene 3: Fun Trip — yellow SUV with happy passengers ── */
function FunTripScene() {
  const roadY   = 140
  const groundY = 155
  const CAR_TOP = 128
  const roofY   = CAR_TOP - 32   // 96

  const chars = [
    { cx: 57,  skinTone: '#FFCE9F', hairColor: '#F9A825' },
    { cx: 111, skinTone: '#C8834A', hairColor: '#1A1A1A', hasGlasses: true },
    { cx: 158, skinTone: '#8D5524', hairColor: '#1A1A1A' },
  ]
  const shirtColors = ['#E64A19', '#1565C0', '#2E7D32']

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
        const rad = a * Math.PI / 180
        return (
          <line key={a}
            x1={184 + 20*Math.cos(rad)} y1={28 + 20*Math.sin(rad)}
            x2={184 + 29*Math.cos(rad)} y2={28 + 29*Math.sin(rad)}
            stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"
          />
        )
      })}

      {/* Stars */}
      {[{x:18,y:28},{x:52,y:16},{x:84,y:40},{x:118,y:20},{x:148,y:36}].map(({x,y},i) => (
        <text key={i} x={x} y={y} fontSize={i%2?9:12} fill={i%2?"white":"#FFC107"} opacity="0.9">★</text>
      ))}

      {/* Car shadow */}
      <ellipse cx="110" cy={groundY + 2} rx="92" ry="5" fill="black" opacity="0.18" />

      {/* Shirt hints */}
      {chars.map((c, i) => (
        <rect key={i} x={c.cx - 12} y={CAR_TOP - 3} width="24" height="10" rx="4"
              fill={shirtColors[i]} opacity="0.9" />
      ))}

      {/* HEADS — drawn before car body */}
      {chars.map((c, i) => (
        <Head key={i} cx={c.cx} cy={roofY + 11} r={11}
              skinTone={c.skinTone} hairColor={c.hairColor}
              hasGlasses={c.hasGlasses} />
      ))}

      {/* Steering wheel */}
      <circle cx="150" cy={CAR_TOP - 4} r="8" fill="none" stroke="#9E9E9E" strokeWidth="2" />
      <line x1="150" y1={CAR_TOP-12} x2="150" y2={CAR_TOP+4} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="142" y1={CAR_TOP-4}  x2="158" y2={CAR_TOP-4} stroke="#9E9E9E" strokeWidth="1.5" />

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
      {/* Door lines */}
      <line x1="90"  y1={CAR_TOP} x2="90"  y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      <line x1="150" y1={CAR_TOP} x2="150" y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      {/* Lights */}
      <rect x="202" y={CAR_TOP+4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
      <rect x="8"   y={CAR_TOP+4} width="8" height="11" rx="2" fill="#EF9A9A" />

      {/* WINDOW GLASS — last */}
      <rect x="37"  y={roofY+4} width="53" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.26" />
      <rect x="97"  y={roofY+4} width="79" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.26" />

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
