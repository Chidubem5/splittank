// RoadHero.jsx
// Renders the decorative banner SVG at the top of the page.
// It shows a road scene with a Toyota RAV4 driving under a blue sky.
//
// SVG COORDINATE SYSTEM:
//   (0,0) is the TOP-LEFT corner. x increases right, y increases DOWN.
//   Think of it like a spreadsheet: row 0 is the top, higher rows go lower.
//
// preserveAspectRatio="xMidYMax slice":
//   "slice" means: scale the image to FILL the container, cropping any excess.
//   "YMax"  means: anchor the BOTTOM of the image to the bottom of the container.
//   Result: on wide screens the sky may be cropped at the top, but the car and
//   road are always fully visible at the bottom. The image always fills
//   edge-to-edge with no empty gaps on the sides.

// ─────────────────────────────────────────
// Head component
// Draws a cartoon face using SVG shapes stacked in order (painter's algorithm:
// shapes drawn later appear on top of shapes drawn earlier).
// cx/cy = center x/y position, r = radius (controls size of the whole head).
// ─────────────────────────────────────────
function Head({ cx, cy, r = 10, skinTone = '#FFCE9F', hairColor = '#4E342E' }) {
  return (
    <g> {/* <g> groups related shapes so they move together */}

      {/* Ears: two small ellipses on either side of the head center */}
      <ellipse cx={cx - r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />
      <ellipse cx={cx + r * 0.92} cy={cy + r * 0.06} rx={r * 0.21} ry={r * 0.28} fill={skinTone} />

      {/* Head circle — drawn AFTER ears so it overlaps their inner edges */}
      <circle cx={cx} cy={cy} r={r} fill={skinTone} />

      {/* Hair: a wide flat ellipse sitting on the upper portion of the head */}
      <ellipse cx={cx} cy={cy - r * 0.45} rx={r * 0.85} ry={r * 0.65} fill={hairColor} />

      {/* Eye whites: two ellipses slightly above center */}
      <ellipse cx={cx - r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />
      <ellipse cx={cx + r * 0.3}  cy={cy - r * 0.1}  rx={r * 0.21} ry={r * 0.19} fill="white" />

      {/* Pupils: dark circles centered inside the eye whites */}
      <circle  cx={cx - r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />
      <circle  cx={cx + r * 0.27} cy={cy - r * 0.08} r={r * 0.12}  fill="#1A1A1A" />

      {/* Eye shine: tiny white dots that make eyes look alive */}
      <circle  cx={cx - r * 0.21} cy={cy - r * 0.17} r={r * 0.05}  fill="white" />
      <circle  cx={cx + r * 0.35} cy={cy - r * 0.17} r={r * 0.05}  fill="white" />

      {/* Smile: a quadratic Bézier curve (Q = curved path).
          M = move to start point, Q = curve through control point to end point.
          The control point (cx, cy+r*0.56) pulls the curve downward = smile. */}
      <path d={`M ${cx-r*0.32},${cy+r*0.27} Q ${cx},${cy+r*0.56} ${cx+r*0.32},${cy+r*0.27}`}
            stroke="#8B4513" strokeWidth={r*0.15} fill="none" strokeLinecap="round" />
    </g>
  )
}

// ─────────────────────────────────────────
// Wheel component
// Draws a detailed car wheel at position (cx, cy).
// The spokes are calculated with trigonometry: each spoke angle is converted
// to radians, then sine/cosine give us the x/y offsets from the center.
// ─────────────────────────────────────────
function Wheel({ cx, cy }) {
  // Five spokes evenly spaced at 72° apart (360° / 5 = 72°)
  const spokes = [0, 72, 144, 216, 288]
  return (
    <g>
      {/* Outer tire (black), inner tire wall (dark grey), hub cap (light grey) */}
      <circle cx={cx} cy={cy} r={19} fill="#1A1A1A" />
      <circle cx={cx} cy={cy} r={13} fill="#2E2E2E" />
      <circle cx={cx} cy={cy} r={7}  fill="#8A8A8A" />

      {/* Spokes: lines from hub edge to inner tire wall */}
      {spokes.map(a => {
        // Convert degrees to radians: radians = degrees × (π / 180)
        const r = a * Math.PI / 180
        return (
          <line key={a}
            // Inner end of spoke: 7px from center (hub radius)
            x1={cx + 7  * Math.cos(r)} y1={cy + 7  * Math.sin(r)}
            // Outer end of spoke: 13px from center (inner tire wall radius)
            x2={cx + 13 * Math.cos(r)} y2={cy + 13 * Math.sin(r)}
            stroke="#8A8A8A" strokeWidth="2.5" strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

// ─────────────────────────────────────────
// SpareTire component
// The 2008 RAV4 has a spare tire mounted on the rear door — a distinctive
// visual feature that helps identify the car model.
// ─────────────────────────────────────────
function SpareTire({ cx, cy }) {
  return (
    <g>
      {/* Outer rubber ring */}
      <circle cx={cx} cy={cy} r={16} fill="#DEDEDE" stroke="#C0C0C0" strokeWidth="2" />
      {/* Inner rim */}
      <circle cx={cx} cy={cy} r={10} fill="#C8C8C8" />
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={4}  fill="#9E9E9E" />
      {/* Four spokes at 90° intervals (cardinal directions) */}
      {[0, 90, 180, 270].map(a => {
        const r = a * Math.PI / 180
        return (
          <line key={a}
            x1={cx + 4  * Math.cos(r)} y1={cy + 4  * Math.sin(r)}
            x2={cx + 10 * Math.cos(r)} y2={cy + 10 * Math.sin(r)}
            stroke="#9E9E9E" strokeWidth="1.5"
          />
        )
      })}
    </g>
  )
}

// ─────────────────────────────────────────
// RoadHeroSVG — the actual SVG scene
// Exported separately so it can be reused (e.g., in tests or other layouts).
// The preserveAspectRatio prop is passed in so the parent can control
// how the scene scales inside its container.
// ─────────────────────────────────────────
export function RoadHeroSVG({ preserveAspectRatio = "xMidYMax slice" }) {

  // ── Ground reference constants ─────────────────────────────────────────
  // These are y-coordinates (vertical positions) in SVG space.
  // The viewBox is 260 units tall, so ROAD_TOP=198 means the road
  // starts about 76% of the way down the image.
  const ROAD_TOP   = 198  // y where the road surface begins
  const GROUND_Y   = 258  // y where the tires touch the road
  const WHEEL_R    = 19   // wheel radius in SVG units
  const WHEEL_CY   = GROUND_Y - WHEEL_R   // wheel center y = 239
  const BODY_BOT   = WHEEL_CY - 4         // bottom of car body = 235
  const WIN_SILL   = BODY_BOT - 20        // base of window openings = 215
  const ROOF_Y     = WHEEL_CY - 62        // top of roof = 177

  // ── Car x-position constants ───────────────────────────────────────────
  // x-coordinates (horizontal) defining the car's footprint in the scene.
  // The car faces right (higher x = further right).
  const CAR_REAR   = 148   // leftmost edge including spare tire
  const BODY_REAR  = 165   // where the main body starts (rear bumper)
  const BODY_FRONT = 358   // where the main body ends (front bumper)
  const CAR_FRONT  = 365   // rightmost edge including bumper

  const REAR_WHL_X = 215   // x center of rear wheel
  const FRNT_WHL_X = 320   // x center of front wheel

  // ── Road dash stripe constants ─────────────────────────────────────────
  const dashY = 235   // y position of center road dashes
  const dashW = 36    // width of each dash stripe
  const dashH = 5     // height of each dash stripe

  return (
      <svg
        viewBox="0 0 900 260"     // the coordinate canvas is 900 wide × 260 tall
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={preserveAspectRatio}
        aria-hidden="true"        // decorative image — screen readers skip it
      >
        <defs>
          {/* A vertical gradient for the sky: deep blue at top, lighter blue at bottom */}
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0277BD" />
            <stop offset="100%" stopColor="#4FC3F7" />
          </linearGradient>
        </defs>

        {/* ── Sky background ─────────────────────────────────────────────── */}
        {/* A rectangle filling the top portion of the scene with the sky gradient */}
        <rect width="900" height={ROAD_TOP + 5} fill="url(#skyG)" />

        {/* Sun: two circles (outer glow + inner bright disc) */}
        <circle cx="820" cy="52" r="38" fill="#FFC107" opacity="0.95" />
        <circle cx="820" cy="52" r="30" fill="#FFD54F" />

        {/* Left cloud: three overlapping ellipses make a fluffy cloud shape */}
        <g opacity="0.88">
          <ellipse cx="130" cy="58" rx="58" ry="22" fill="white" />
          <ellipse cx="170" cy="50" rx="44" ry="17" fill="white" />
          <ellipse cx="92"  cy="63" rx="34" ry="15" fill="white" />
        </g>

        {/* Right-center cloud: slightly more transparent for depth */}
        <g opacity="0.72">
          <ellipse cx="560" cy="62" rx="62" ry="21" fill="white" />
          <ellipse cx="598" cy="54" rx="46" ry="17" fill="white" />
          <ellipse cx="520" cy="67" rx="35" ry="15" fill="white" />
        </g>

        {/* ── Hills at the horizon ────────────────────────────────────────── */}
        {/* Three overlapping ellipses at different opacities create rolling
            hills with a sense of depth (lighter = further away) */}
        <ellipse cx="130"  cy={ROAD_TOP + 4} rx="210" ry="36" fill="#81C784" opacity="0.55" />
        <ellipse cx="720"  cy={ROAD_TOP + 4} rx="245" ry="33" fill="#A5D6A7" opacity="0.45" />
        <ellipse cx="420"  cy={ROAD_TOP + 5} rx="175" ry="28" fill="#66BB6A" opacity="0.38" />

        {/* Ground strip: a thin strip of green between sky and road */}
        <rect y={ROAD_TOP - 8} width="900" height="12" fill="#8BC34A" opacity="0.35" />

        {/* ── Road surface ─────────────────────────────────────────────────── */}
        {/* Grey rectangle fills from ROAD_TOP to the bottom of the viewBox */}
        <rect y={ROAD_TOP} width="900" height={260 - ROAD_TOP} fill="#9E9E9E" />
        {/* Darker strip at the very top of the road = road edge shadow */}
        <rect y={ROAD_TOP} width="900" height="4"               fill="#6E6E6E" />

        {/* ── Center yellow dashes ──────────────────────────────────────────── */}
        {/* Array.from creates an array of 17 items so we can map over them.
            Each dash is offset by 58px horizontally (36px dash + 22px gap). */}
        {Array.from({ length: 17 }, (_, i) => (
          <rect key={i} x={i * 58} y={dashY} width={dashW} height={dashH} rx="2" fill="#FFC107" />
        ))}

        {/* Shoulder line: a faint white line along the road edge */}
        <line x1="0" y1={ROAD_TOP + 2} x2="900" y2={ROAD_TOP + 2} stroke="#E0E0E0" strokeWidth="2" opacity="0.5" />

        {/* Speed motion lines: faint white horizontal streaks to the left of
            the car, suggesting the car just arrived from that direction */}
        <line x1="20"  y1={WHEEL_CY - 28} x2="130" y2={WHEEL_CY - 28} stroke="white" strokeWidth="1.5" opacity="0.22" />
        <line x1="8"   y1={WHEEL_CY - 18} x2="140" y2={WHEEL_CY - 18} stroke="white" strokeWidth="2"   opacity="0.15" />
        <line x1="30"  y1={WHEEL_CY - 10} x2="138" y2={WHEEL_CY - 10} stroke="white" strokeWidth="1"   opacity="0.18" />

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2008 Toyota RAV4 — white, facing right                            */}
        {/* PAINTER'S ALGORITHM: shapes are drawn bottom-to-top in the code.  */}
        {/* Later shapes appear ON TOP of earlier ones (like painting a canvas)*/}
        {/* ══════════════════════════════════════════════════════════════════ */}

        {/* Ground shadow: a semi-transparent ellipse under the car */}
        <ellipse cx="265" cy={GROUND_Y + 2} rx="112" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Rear spare tire (the iconic RAV4 feature mounted on the back door) */}
        <SpareTire cx={CAR_REAR + 2} cy={BODY_BOT - 17} />

        {/* Lower body: the boxy sill/door panel below the windows */}
        <rect
          x={BODY_REAR} y={WIN_SILL}
          width={BODY_FRONT - BODY_REAR} height={BODY_BOT - WIN_SILL}
          rx="4" fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* Cabin / greenhouse: the upper glass area of the car.
            A <path> with M (move), L (line), Z (close) draws a polygon.
            The near-vertical C-pillar (rear) and raked A-pillar (front) are
            characteristic of the boxy 2008 RAV4 silhouette. */}
        <path
          d={`M ${BODY_REAR + 18},${WIN_SILL}
              L ${BODY_REAR + 20},${ROOF_Y}
              L ${BODY_FRONT - 62},${ROOF_Y}
              L ${BODY_FRONT - 38},${WIN_SILL} Z`}
          fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* ── Passengers ────────────────────────────────────────────────────
            Drawn AFTER the cabin fill but BEFORE the window tint, so they
            appear inside the cabin behind tinted glass. */}

        {/* Shirt hints visible at the window sill line */}
        <rect x={BODY_REAR + 26} y={WIN_SILL - 8} width={26} height={10} rx={3} fill="#2E7D32" opacity="0.85" />
        <rect x={BODY_REAR + 80} y={WIN_SILL - 8} width={30} height={10} rx={3} fill="#1565C0" opacity="0.85" />

        {/* Rear passenger head (darker skin, black hair) */}
        <Head cx={BODY_REAR + 40} cy={ROOF_Y + 21} r={11} skinTone="#C8834A" hairColor="#1A1A1A" />
        {/* Driver head (light skin, brown hair) */}
        <Head cx={BODY_REAR + 96} cy={ROOF_Y + 21} r={11} skinTone="#FFCE9F" hairColor="#4E342E" />

        {/* Rear window glass tint — drawn AFTER passengers so it sits on top */}
        <path
          d={`M ${BODY_REAR + 24},${WIN_SILL - 1}
              L ${BODY_REAR + 26},${ROOF_Y + 3}
              L ${BODY_REAR + 68},${ROOF_Y + 3}
              L ${BODY_REAR + 68},${WIN_SILL - 1} Z`}
          fill="#90CAF9" opacity="0.40"   // light blue at 40% opacity = tinted glass
        />

        {/* B-pillar: the vertical support between rear and front windows */}
        <rect
          x={BODY_REAR + 68} y={ROOF_Y + 2}
          width="5" height={WIN_SILL - ROOF_Y - 1}
          rx="1" fill="#C8C8C8"
        />

        {/* Front window glass tint */}
        <path
          d={`M ${BODY_REAR + 77},${WIN_SILL - 1}
              L ${BODY_REAR + 77},${ROOF_Y + 3}
              L ${BODY_FRONT - 65},${ROOF_Y + 3}
              L ${BODY_FRONT - 42},${WIN_SILL - 1} Z`}
          fill="#90CAF9" opacity="0.40"
        />

        {/* Roof rack rails with mounting points */}
        <rect x={BODY_REAR + 36} y={ROOF_Y - 2} width="110" height="3" rx="1.5" fill="#CACACA" />
        <rect x={BODY_REAR + 46} y={ROOF_Y - 4} width="8" height="5" rx="1.5" fill="#B0B0B0" />
        <rect x={BODY_REAR + 128} y={ROOF_Y - 4} width="8" height="5" rx="1.5" fill="#B0B0B0" />

        {/* Hood: a shallow trapezoid sloping slightly downward from the A-pillar */}
        <path
          d={`M ${BODY_FRONT - 38},${WIN_SILL}
              L ${BODY_FRONT + 2},${WIN_SILL + 3}
              L ${BODY_FRONT + 2},${WIN_SILL + 12}
              L ${BODY_FRONT - 38},${WIN_SILL + 12} Z`}
          fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* Front bumper */}
        <rect x={BODY_FRONT} y={WIN_SILL + 1} width="8" height={BODY_BOT - WIN_SILL - 1} rx="3" fill="#CCCCCC" />

        {/* Headlights + daytime running light strip */}
        <rect x={BODY_FRONT - 5} y={WIN_SILL + 4} width="11" height="9" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
        <rect x={BODY_FRONT - 4} y={WIN_SILL + 15} width="9" height="3" rx="1.5" fill="#FFF9C4" opacity="0.8" />

        {/* Front grille */}
        <rect x={BODY_FRONT - 1} y={WIN_SILL + 20} width="6" height="10" rx="2" fill="#D0D0D0" />

        {/* Rear bumper */}
        <rect x={BODY_REAR - 2} y={WIN_SILL + 1} width="7" height={BODY_BOT - WIN_SILL - 1} rx="2" fill="#CCCCCC" />

        {/* Taillights: red main light + amber reverse light */}
        <rect x={BODY_REAR + 1} y={WIN_SILL + 3} width="9" height="14" rx="2" fill="#EF9A9A" />
        <rect x={BODY_REAR + 1} y={WIN_SILL + 19} width="6" height="6" rx="1" fill="#FFCCBC" />

        {/* Body side trim line: a subtle crease running the length of the car */}
        <line
          x1={BODY_REAR + 8} y1={WIN_SILL + 14}
          x2={BODY_FRONT - 4} y2={WIN_SILL + 14}
          stroke="#D0D0D0" strokeWidth="2"
        />

        {/* Side mirror: mounted at the base of the A-pillar */}
        <path
          d={`M ${BODY_FRONT - 38},${WIN_SILL - 1}
              L ${BODY_FRONT - 30},${WIN_SILL - 8}
              L ${BODY_FRONT - 22},${WIN_SILL - 8}
              L ${BODY_FRONT - 22},${WIN_SILL - 1} Z`}
          fill="#D0D0D0" stroke="#C0C0C0" strokeWidth="1"
        />

        {/* Door handles */}
        <rect x={BODY_REAR + 90} y={WIN_SILL + 6} width="16" height="4" rx="2" fill="#C0C0C0" />
        <rect x={BODY_REAR + 150} y={WIN_SILL + 6} width="18" height="4" rx="2" fill="#C0C0C0" />

        {/* Wheel well arches: quadratic Bézier curves that arch over each wheel.
            Q cx,cy x2,y2 = curve from current point to (x2,y2) bending toward (cx,cy) */}
        <path
          d={`M ${REAR_WHL_X - 26},${BODY_BOT}
              Q ${REAR_WHL_X},${BODY_BOT - 14}
              ${REAR_WHL_X + 26},${BODY_BOT}`}
          fill="#C8C8C8" stroke="#C8C8C8" strokeWidth="1"
        />
        <path
          d={`M ${FRNT_WHL_X - 26},${BODY_BOT}
              Q ${FRNT_WHL_X},${BODY_BOT - 14}
              ${FRNT_WHL_X + 26},${BODY_BOT}`}
          fill="#C8C8C8" stroke="#C8C8C8" strokeWidth="1"
        />

        {/* Wheels: drawn last so they appear in front of the body */}
        <Wheel cx={REAR_WHL_X} cy={WHEEL_CY} />
        <Wheel cx={FRNT_WHL_X} cy={WHEEL_CY} />

        {/* ── Utility poles ─────────────────────────────────────────────────
            Vertical lines + horizontal crossbars at four positions along the road.
            Poles further right are shorter (x1/x2 closer together) to suggest
            they're further away (perspective). */}
        <line x1="55"  y1="120" x2="55"  y2={ROAD_TOP} stroke="#757575" strokeWidth="4" />
        <line x1="37"  y1="132" x2="73"  y2="132"      stroke="#757575" strokeWidth="2.5" />
        <line x1="560" y1="135" x2="560" y2={ROAD_TOP} stroke="#757575" strokeWidth="3.5" />
        <line x1="544" y1="145" x2="576" y2="145"      stroke="#757575" strokeWidth="2" />
        <line x1="700" y1="140" x2="700" y2={ROAD_TOP} stroke="#757575" strokeWidth="3" />
        <line x1="686" y1="149" x2="714" y2="149"      stroke="#757575" strokeWidth="1.5" />
        <line x1="840" y1="145" x2="840" y2={ROAD_TOP} stroke="#757575" strokeWidth="3.5" />
        <line x1="824" y1="155" x2="856" y2="155"      stroke="#757575" strokeWidth="2" />

        {/* ── Power wires ──────────────────────────────────────────────────
            Each wire is a Bézier curve sagging between two pole crossbar ends.
            The middle control point (Q) sits below the endpoints, creating the
            realistic droop/catenary shape of a real power line. */}
        <path d="M 37,132 Q 290,151 544,145" fill="none" stroke="#5A5A5A" strokeWidth="1.2" />
        <path d="M 73,132 Q 324,151 576,145" fill="none" stroke="#5A5A5A" strokeWidth="1.2" />
        <path d="M 544,145 Q 615,157 686,149" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        <path d="M 576,145 Q 645,157 714,149" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        <path d="M 686,149 Q 755,163 824,155" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        <path d="M 714,149 Q 785,163 856,155" fill="none" stroke="#5A5A5A" strokeWidth="1" />
      </svg>
  )
}

// ─────────────────────────────────────────
// RoadHero — the exported wrapper component
// Just wraps the SVG in a div that the CSS targets for sizing/overflow.
// ─────────────────────────────────────────
export default function RoadHero() {
  return (
    <div className="road-hero">
      <RoadHeroSVG />
    </div>
  )
}
