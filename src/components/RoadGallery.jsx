// RoadGallery.jsx — Three decorative panel scenes at the bottom of the page
//
// Each panel contains a hand-drawn SVG illustration + a marketing quote.
// The scenes are: carpool sedan, shocked person at gas pump, fun trip SUV.
//
// WHY THREE PANELS:
//   The gallery communicates the app's use cases visually without walls of text:
//   1. CarpoolScene  — "split fairly with friends"
//   2. GasPriceScene — "live gas prices from EIA" (connected to api/gasPrice.js)
//   3. FunTripScene  — "don't let gas stop you from going"
//
// HOW IT CONNECTS TO OTHER FILES:
//   • Imports RoadHeroSVG from RoadHero.jsx — originally intended to reuse the
//     hero scene inside one of the panels; the import is kept for potential
//     future reuse. The Wheel and Head sub-components are re-implemented here
//     with slightly different defaults (different tire style, glasses support).
//   • App.css — .road-gallery, .gallery-panel, .gallery-scene, .gallery-quote
//     classes style the grid, panel borders, and quote typography.
//   • --panel-accent and --panel-border are CSS custom properties set inline
//     on each panel div so the stylesheet can reference them without knowing
//     each panel's specific color at compile time.
//
// SVG DRAWING APPROACH — PAINTER'S ALGORITHM:
//   SVG draws shapes in the ORDER they appear in the code.
//   Later shapes appear ON TOP of earlier shapes.
//   So: background → ground → car body → passengers → window tint → wheels
//   Putting passengers before window tint makes them appear inside the car
//   behind tinted glass instead of floating in front of it.

// RoadHeroSVG is exported from RoadHero.jsx — it renders the full road scene
// with constants and sub-components. Imported here for potential panel reuse.
import { RoadHeroSVG } from './RoadHero'

// ─────────────────────────────────────────
// Wheel — reusable tire component for scene cars
// Same structure as RoadHero.jsx's Wheel but with slightly different
// default size (r=18) and a dark grey inner rim instead of a medium grey.
// cx/cy = center coordinates, r = outer radius
// ─────────────────────────────────────────
function Wheel({ cx, cy, r = 18 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}     fill="#1C1C1E" />   {/* outer rubber */}
      <circle cx={cx} cy={cy} r={r - 5} fill="#2C2C2E" />   {/* inner rim */}
      <circle cx={cx} cy={cy} r={5}     fill="#8E8E93" />   {/* hub cap */}
      {/* Five spokes at 72° intervals — same trig as RoadHero.jsx's Wheel */}
      {[0,72,144,216,288].map(a => {
        const rad = a * Math.PI / 180   // convert degrees → radians for Math.cos/sin
        return (
          <line key={a}
            x1={cx + 5      * Math.cos(rad)} y1={cy + 5      * Math.sin(rad)}
            x2={cx + (r-5)  * Math.cos(rad)} y2={cy + (r-5)  * Math.sin(rad)}
            stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

// ─────────────────────────────────────────
// Head — cartoon face component
// Extended version of RoadHero.jsx's Head with two additional props:
//   happy       — true = smile (default), false = frown (for GasPriceScene)
//   hasGlasses  — true adds wire-frame glasses over the eyes
// Proportions are all multiples of r so the face scales with the head size.
// ─────────────────────────────────────────
function Head({ cx, cy, r = 10, skinTone = '#FFCE9F', hairColor = '#4E342E', happy = true, hasGlasses = false }) {
  return (
    <g>
      {/* Ears — two ellipses on either side, drawn before the head circle
          so the head overlaps their inner edges */}
      <ellipse cx={cx - r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />
      <ellipse cx={cx + r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />
      <circle cx={cx} cy={cy} r={r} fill={skinTone} />
      {/* Hair sits on the top half of the head circle */}
      <ellipse cx={cx} cy={cy - r * 0.45} rx={r * 0.85} ry={r * 0.65} fill={hairColor} />
      {/* Eyes: whites, then dark pupils on top, then tiny shine dot on top of that */}
      <ellipse cx={cx - r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />
      <ellipse cx={cx + r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />
      <circle  cx={cx - r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />
      <circle  cx={cx + r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />
      <circle  cx={cx - r * 0.21} cy={cy - r * 0.17} r={r * 0.05} fill="white" />
      <circle  cx={cx + r * 0.35} cy={cy - r * 0.17} r={r * 0.05} fill="white" />
      {/* Glasses: two ellipses with frame lines, only rendered when hasGlasses=true */}
      {hasGlasses && (
        <g stroke="#5D4037" strokeWidth={r * 0.1} fill="none" opacity="0.9">
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.1} rx={r * 0.23} ry={r * 0.21} />
          <ellipse cx={cx + r * 0.3} cy={cy - r * 0.1} rx={r * 0.23} ry={r * 0.21} />
          {/* Bridge between the two lenses */}
          <line x1={cx - r*0.07} y1={cy - r*0.1} x2={cx + r*0.07} y2={cy - r*0.1} />
          {/* Side arms extending outward */}
          <line x1={cx - r*0.53} y1={cy - r*0.1} x2={cx - r*0.67} y2={cy - r*0.06} />
          <line x1={cx + r*0.53} y1={cy - r*0.1} x2={cx + r*0.67} y2={cy - r*0.06} />
        </g>
      )}
      {/* Mouth: a Bézier curve. Q cx,cy x2,y2 = curve from current point to x2,y2
          bending toward the control point (cx, cy).
          Happy: control point below endpoints → smile
          Sad:   control point above endpoints → frown */}
      {happy
        ? <path d={`M ${cx-r*0.32},${cy+r*0.27} Q ${cx},${cy+r*0.58} ${cx+r*0.32},${cy+r*0.27}`}
                stroke="#8B4513" strokeWidth={r*0.15} fill="none" strokeLinecap="round" />
        : <path d={`M ${cx-r*0.32},${cy+r*0.5} Q ${cx},${cy+r*0.27} ${cx+r*0.32},${cy+r*0.5}`}
                stroke="#8B4513" strokeWidth={r*0.15} fill="none" strokeLinecap="round" />
      }
    </g>
  )
}

// ─────────────────────────────────────────
// SceneBg — shared sky + road background
// Used by CarpoolScene and FunTripScene (GasPriceScene has its own background).
// The gradient id includes the skyTop color value to avoid SVG id collisions
// when multiple SceneBg instances are on the same page.
// ─────────────────────────────────────────
function SceneBg({ skyTop = '#0288D1', skyBot = '#4FC3F7', roadY = 138 }) {
  return (
    <>
      <defs>
        {/* Unique gradient id per color set — avoids two SVGs sharing the same
            gradient id and the second one accidentally using the first's colors */}
        <linearGradient id={`sky_${skyTop.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
      </defs>
      {/* Sky fills from top down to roadY */}
      <rect width="220" height={roadY} fill={`url(#sky_${skyTop.slice(1)})`} />
      {/* Two green hill ellipses at the horizon line for depth */}
      <ellipse cx="40"  cy={roadY} rx="55"  ry="18" fill="#4CAF50" opacity="0.5" />
      <ellipse cx="175" cy={roadY} rx="65"  ry="15" fill="#388E3C" opacity="0.4" />
      {/* Road: grey rectangle from roadY to the bottom of the 200-unit viewBox */}
      <rect y={roadY}      width="220" height={200 - roadY} fill="#757575" />
      {/* Darker top strip of road = edge shadow */}
      <rect y={roadY}      width="220" height="3"            fill="#616161" />
      {/* Four center dashes — same yellow (#FFC107) used in App.css --yellow variable */}
      {[0,1,2,3].map(i => (
        <rect key={i} x={i * 58 - 4} y={roadY + (200 - roadY) / 2 - 3}
              width="34" height="5" rx="2" fill="#FFC107" opacity="0.7" />
      ))}
    </>
  )
}

// ─────────────────────────────────────────
// CarpoolScene — white sedan with 4 passengers
// Illustrates the app's main use case: multiple people in one car splitting costs.
// chars[] defines the four passengers' appearance; shirtColors[] provides
// color-coded shirt hints visible at the window sill line.
// ─────────────────────────────────────────
function CarpoolScene() {
  // Y-coordinates for the car layers (see painter's algorithm note at top of file)
  const roadY   = 136  // y where the road starts
  const groundY = 158  // y where the wheels touch the ground
  const bodyY   = 116  // y of the bottom of the car body (door panel base)
  const roofY   = 94   // y of the roof line
  const winY    = roofY + 5  // y of the top of the window openings

  // Four passengers with different skin tones, hair, and optional glasses.
  // cx values are x-positions of their heads inside the cabin.
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
      <circle cx="182" cy="30" r="20" fill="#FFD54F" />   {/* sun outer glow */}
      <circle cx="182" cy="30" r="13" fill="#FFF9C4" />   {/* sun bright core */}
      <g opacity="0.88">
        <ellipse cx="62" cy="38" rx="30" ry="12" fill="white" />
        <ellipse cx="80" cy="30" rx="22" ry="10" fill="white" />
      </g>

      {/* Car drop shadow */}
      <ellipse cx="110" cy={groundY + 2} rx="85" ry="5" fill="black" opacity="0.14" />

      {/* Shirt hints rendered BEFORE heads so the head circle overlaps the shirt top */}
      {chars.map((c, i) => (
        <rect key={i} x={c.cx - 11} y={bodyY - 3} width="22" height="10" rx="4"
              fill={shirtColors[i]} opacity="0.88" />
      ))}

      {/* Heads rendered BEFORE car body + window tint so they appear inside the car */}
      {chars.map((c, i) => (
        <Head key={i} cx={c.cx} cy={winY + 11} r={10}
              skinTone={c.skinTone} hairColor={c.hairColor}
              hasGlasses={c.hasGlasses} />
      ))}

      {/* Steering wheel hint visible in front-passenger window area */}
      <circle cx="140" cy={winY + 22} r="6" fill="none" stroke="#9E9E9E" strokeWidth="1.8" />
      <line x1="140" y1={winY+16} x2="140" y2={winY+28} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="134" y1={winY+22} x2="146" y2={winY+22} stroke="#9E9E9E" strokeWidth="1.5" />

      {/* Car body drawn AFTER passengers so it covers their shoulders */}
      <rect x="18" y={bodyY} width="186" height="24" rx="6" fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="1.5" />
      <rect x="50"  y={roofY} width="120" height="5" rx="2" fill="#E0E0E0" />  {/* roof panel */}
      {/* C-pillar (rear), B-pillar (center), A-pillar (front) — vertical supports */}
      <path d={`M 44,${bodyY} L 52,${roofY} L 58,${roofY} L 50,${bodyY} Z`} fill="#DCDCDC" />
      <rect x="103" y={roofY} width="5" height={bodyY - roofY} fill="#BDBDBD" />
      <path d={`M 162,${roofY} L 180,${bodyY} L 174,${bodyY} L 158,${roofY} Z`} fill="#DCDCDC" />
      <rect x="12"  y={bodyY+4} width="8" height="11" rx="2" fill="#EF9A9A" />    {/* taillights */}
      <rect x="202" y={bodyY+4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" /> {/* headlights */}
      <rect x="78"  y={bodyY+8} width="12" height="3" rx="1.5" fill="#C0C0C0" />   {/* door handle */}
      <rect x="130" y={bodyY+8} width="14" height="3" rx="1.5" fill="#C0C0C0" />   {/* door handle */}

      {/* Window glass tint drawn LAST — on top of everything inside the cabin.
          Light blue at 22% opacity gives the impression of real glass. */}
      <path d={`M 52,${bodyY-1} L 54,${roofY+3} L 100,${roofY+3} L 100,${bodyY-1} Z`}
            fill="#81D4FA" opacity="0.22" />
      <path d={`M 112,${bodyY-1} L 112,${roofY+3} L 162,${roofY+3} L 177,${bodyY-1} Z`}
            fill="#81D4FA" opacity="0.22" />

      <Wheel cx={60}  cy={groundY} r={18} />
      <Wheel cx={162} cy={groundY} r={18} />
    </svg>
  )
}

// ─────────────────────────────────────────
// GasPriceScene — shocked person next to a gas pump
// Communicates the "live gas prices" feature (api/gasPrice.js fetches
// EIA weekly data; gasPrices.js provides the static fallback).
// The $4.85 price and "↑ UP 12¢" on the pump are fictional props, not live data.
// ─────────────────────────────────────────
function GasPriceScene() {
  const pX  = 162   // person center-x (positioned to the right of the pump)
  const pHY = 118   // person head center-y
  const hR  = 17    // head radius (larger than car passengers — this is a close-up)

  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        {/* Warm yellow background — conveys sunny day / urgency of high prices */}
        <linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#FFF8E1" />
        </linearGradient>
        {/* Pump body: dark steel gradient gives a metallic appearance */}
        <linearGradient id="gPump" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#546E7A" />
          <stop offset="100%" stopColor="#37474F" />
        </linearGradient>
      </defs>

      <rect width="220" height="200" fill="url(#gBg)" />
      {/* Giant semi-transparent $ watermark behind everything for context */}
      <text x="90" y="145" textAnchor="middle" fontSize="160" fontWeight="900"
            fill="#FFC107" opacity="0.07">$</text>

      {/* Pump body + top cap */}
      <rect x="28" y="42" width="68" height="108" rx="8" fill="url(#gPump)" />
      <rect x="23" y="36" width="78" height="12"  rx="4" fill="#263238" />
      {/* Thin white highlight on the left edge — simulates a light source from the left */}
      <rect x="31" y="46" width="7"  height="100" rx="3" fill="white" opacity="0.06" />

      {/* Price display screen: dark background like a real LCD display */}
      <rect x="36" y="56" width="48" height="40" rx="5" fill="#0D0D0D" />
      <text x="60" y="72" textAnchor="middle" fontSize="9" fontWeight="900"
            fill="#FF1744" letterSpacing="1">$4.85</text>
      <text x="60" y="82" textAnchor="middle" fontSize="6"  fill="#78909C">/gallon</text>
      <text x="60" y="92" textAnchor="middle" fontSize="7" fontWeight="700"
            fill="#FF5252" opacity="0.85">↑ UP 12¢</text>

      {/* Keypad: 3×3 grid of circular buttons */}
      {[0,1,2].map(col => [0,1,2].map(row => (
        <circle key={`${col}-${row}`}
          cx={42 + col*11} cy={108 + row*9} r="3" fill="#455A64" />
      )))}

      {/* Fuel hose: a horizontal nozzle housing + curved hose + nozzle tip */}
      <rect x="96" y="76" width="22" height="6" rx="3" fill="#78909C" />   {/* nozzle housing */}
      <rect x="114" y="70" width="6"  height="16" rx="3" fill="#607D8B" /> {/* coupler */}
      {/* Hose: two overlapping paths — the outer dark path gives thickness,
          the inner dashed path suggests the corrugated ridges */}
      <path d="M 96 79 Q 130 100 122 126"
            stroke="#263238" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 96 79 Q 130 100 122 126"
            stroke="#546E7A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 4" />
      <rect x="115" y="124" width="12" height="8" rx="2" fill="#1C1C1E" />  {/* nozzle tip */}

      {/* Three red up-arrows above the pump — price increasing visually */}
      {[{ x:34,t:26 }, { x:50,t:18 }, { x:66,t:28 }].map(({ x, t }) => (
        <g key={x}>
          <polygon points={`${x-5},${t+9} ${x+5},${t+9} ${x},${t}`} fill="#FF1744" />
          <line x1={x} y1={t+9} x2={x} y2={t+20}
                stroke="#FF1744" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      {/* Shocked person — body drawn BEFORE head so head appears on top */}
      <rect x={pX-16} y={pHY+hR} width="32" height="26" rx="7" fill="#1565C0" />  {/* shirt */}
      {/* Arms raised in shock — lines from shoulder to hands */}
      <line x1={pX-14} y1={pHY+hR+8} x2={pX-34} y2={pHY-4}
            stroke="#E8A87C" strokeWidth="8" strokeLinecap="round" />
      <line x1={pX+14} y1={pHY+hR+8} x2={pX+34} y2={pHY-4}
            stroke="#E8A87C" strokeWidth="8" strokeLinecap="round" />
      <circle cx={pX-34} cy={pHY-4} r="6" fill="#E8A87C" />  {/* left hand */}
      <circle cx={pX+34} cy={pHY-4} r="6" fill="#E8A87C" />  {/* right hand */}
      {/* Head with happy=false → frown expression */}
      <Head cx={pX} cy={pHY} r={hR} skinTone="#E8A87C" hairColor="#5D4037" happy={false} />

      {/* Ground strip and pump base */}
      <rect y="162" width="220" height="38" fill="#BDBDBD" />
      <rect x="18"  y="148"  width="88" height="16" rx="5" fill="#263238" />
    </svg>
  )
}

// ─────────────────────────────────────────
// FunTripScene — yellow SUV with happy passengers + bright sun
// Communicates the optimistic framing: gas costs don't have to stop a fun trip,
// they just need to be split fairly (which is the whole point of the app).
// ─────────────────────────────────────────
function FunTripScene() {
  const roadY   = 140
  const groundY = 155
  const CAR_TOP = 128   // y of the bottom of the car body
  const roofY   = CAR_TOP - 32   // 96 = top of roof

  const chars = [
    { cx: 57,  skinTone: '#FFCE9F', hairColor: '#F9A825' },                      // blonde driver
    { cx: 111, skinTone: '#C8834A', hairColor: '#1A1A1A', hasGlasses: true },    // glasses passenger
    { cx: 158, skinTone: '#8D5524', hairColor: '#1A1A1A' },                      // rear passenger
  ]
  const shirtColors = ['#E64A19', '#1565C0', '#2E7D32']

  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0277BD" />
          <stop offset="100%" stopColor="#4FC3F7" />
        </linearGradient>
        {/* Yellow gradient for the SUV body — top lighter, bottom richer */}
        <linearGradient id="fCar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD740" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>

      {/* Sky + hills + road */}
      <rect width="220" height={roadY} fill="url(#fSky)" />
      <ellipse cx="30"  cy={roadY} rx="52" ry="18" fill="#4CAF50" opacity="0.45" />
      <ellipse cx="192" cy={roadY} rx="58" ry="14" fill="#388E3C" opacity="0.4" />
      <rect y={roadY}      width="220" height={200 - roadY} fill="#757575" />
      <rect y={roadY}      width="220" height="3"           fill="#616161" />
      {[0,1,2,3].map(i => (
        <rect key={i} x={i * 58 - 4} y={roadY + 14} width="34" height="5" rx="2"
              fill="#FFC107" opacity="0.75" />
      ))}

      {/* Sun with eight radiating spokes — more festive than just a circle */}
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

      {/* Decorative stars/sparkles in the sky — every other one is yellow */}
      {[{x:18,y:28},{x:52,y:16},{x:84,y:40},{x:118,y:20},{x:148,y:36}].map(({x,y},i) => (
        <text key={i} x={x} y={y} fontSize={i%2?9:12} fill={i%2?"white":"#FFC107"} opacity="0.9">★</text>
      ))}

      <ellipse cx="110" cy={groundY + 2} rx="92" ry="5" fill="black" opacity="0.18" /> {/* shadow */}

      {/* Shirts → heads → car body → window glass (painter's order) */}
      {chars.map((c, i) => (
        <rect key={i} x={c.cx - 12} y={CAR_TOP - 3} width="24" height="10" rx="4"
              fill={shirtColors[i]} opacity="0.9" />
      ))}
      {chars.map((c, i) => (
        <Head key={i} cx={c.cx} cy={roofY + 11} r={11}
              skinTone={c.skinTone} hairColor={c.hairColor}
              hasGlasses={c.hasGlasses} />
      ))}

      {/* Steering wheel */}
      <circle cx="150" cy={CAR_TOP - 4} r="8"  fill="none" stroke="#9E9E9E" strokeWidth="2" />
      <line x1="150" y1={CAR_TOP-12} x2="150" y2={CAR_TOP+4} stroke="#9E9E9E" strokeWidth="1.5" />
      <line x1="142" y1={CAR_TOP-4}  x2="158" y2={CAR_TOP-4} stroke="#9E9E9E" strokeWidth="1.5" />

      {/* Yellow SUV body + structural panels */}
      <rect x="8"  y={CAR_TOP} width="204" height="26" rx="5" fill="url(#fCar)" stroke="#F9A825" strokeWidth="2" />
      <path d={`M 18,${CAR_TOP} L 28,${roofY} L 36,${roofY} L 26,${CAR_TOP} Z`} fill="#F9A825" />  {/* C-pillar */}
      <rect x="28" y={roofY} width="162" height="5" rx="2" fill="#F9A825" />                        {/* roof bar */}
      <rect x="90" y={roofY} width="6" height={CAR_TOP - roofY} fill="#F9A825" />                   {/* B-pillar */}
      <path d={`M 180,${roofY} L 202,${CAR_TOP} L 194,${CAR_TOP} L 176,${roofY} Z`} fill="#F9A825" /> {/* A-pillar */}
      {/* Door lines as subtle separators */}
      <line x1="90"  y1={CAR_TOP} x2="90"  y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      <line x1="150" y1={CAR_TOP} x2="150" y2={CAR_TOP+26} stroke="#F9A825" strokeWidth="1.5" opacity="0.5" />
      <rect x="202" y={CAR_TOP+4} width="8" height="11" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />  {/* headlights */}
      <rect x="8"   y={CAR_TOP+4} width="8" height="11" rx="2" fill="#EF9A9A" />                                  {/* taillights */}

      {/* Window glass — last, on top */}
      <rect x="37"  y={roofY+4} width="53" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.26" />
      <rect x="97"  y={roofY+4} width="79" height={CAR_TOP-roofY-4} rx="2" fill="#81D4FA" opacity="0.26" />

      <Wheel cx={58}  cy={groundY} r={20} />
      <Wheel cx={163} cy={groundY} r={20} />
    </svg>
  )
}

// PANELS is the data array that drives the gallery grid.
// Each entry pairs a Scene component with its quote and color theme.
// --panel-accent and --panel-border are CSS custom properties injected
// inline so App.css can style each panel differently without needing
// separate CSS classes per panel.
const PANELS = [
  {
    Scene:  CarpoolScene,
    quote:  'Carpool smarter — everyone pays their fair share',
    accent: '#E3F2FD',   // light blue tint
    border: '#4FC3F7',   // sky blue border
  },
  {
    Scene:  GasPriceScene,
    quote:  'Live gas prices update daily so the math is always right',
    accent: '#FFF8E1',   // light yellow tint (connects to EIA live data theme)
    border: '#FFC107',   // yellow = --yellow in App.css
  },
  {
    Scene:  FunTripScene,
    quote:  "Don't let gas costs get in the way of a great trip",
    accent: '#E8F5E9',   // light green tint
    border: '#A5D6A7',   // soft green border
  },
]

// RoadGallery renders below the main calculator in App.jsx,
// above the <footer> and above the auth modals.
export default function RoadGallery() {
  return (
    <section className="road-gallery">
      <div className="road-gallery-inner">
        {/* Each panel gets its scene-specific colors via CSS custom properties.
            key={quote} works here because all three quotes are unique strings. */}
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
