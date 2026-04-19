function Wheel({ cx, cy }) {
  const spokes = [0, 72, 144, 216, 288]
  return (
    <g>
      <circle cx={cx} cy={cy} r={19} fill="#1A1A1A" />
      <circle cx={cx} cy={cy} r={13} fill="#2E2E2E" />
      <circle cx={cx} cy={cy} r={7}  fill="#8A8A8A" />
      {spokes.map(a => {
        const r = a * Math.PI / 180
        return (
          <line key={a}
            x1={cx + 7  * Math.cos(r)} y1={cy + 7  * Math.sin(r)}
            x2={cx + 13 * Math.cos(r)} y2={cy + 13 * Math.sin(r)}
            stroke="#8A8A8A" strokeWidth="2.5" strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

function SpareTire({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} fill="#DEDEDE" stroke="#C0C0C0" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={10} fill="#C8C8C8" />
      <circle cx={cx} cy={cy} r={4}  fill="#9E9E9E" />
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

export default function RoadHero() {
  // Road surface and car ground reference
  const ROAD_TOP   = 198  // y where road starts
  const GROUND_Y   = 258  // y where tires touch road
  const WHEEL_R    = 19
  const WHEEL_CY   = GROUND_Y - WHEEL_R        // 239
  const BODY_BOT   = WHEEL_CY - 4              // 235 — bottom of car body
  const WIN_SILL   = BODY_BOT - 20             // 215 — base of windows
  const ROOF_Y     = WHEEL_CY - 62             // 177 — top of roof

  // Car x bounds (heading right)
  const CAR_REAR   = 148   // includes spare tire
  const BODY_REAR  = 165
  const BODY_FRONT = 358
  const CAR_FRONT  = 365

  const REAR_WHL_X = 215
  const FRNT_WHL_X = 320

  // Center dashes
  const dashY = 235
  const dashW = 36
  const dashH = 5

  return (
    <div className="road-hero">
      <svg
        viewBox="0 0 900 260"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0277BD" />
            <stop offset="100%" stopColor="#4FC3F7" />
          </linearGradient>
        </defs>

        {/* ── Sky ── */}
        <rect width="900" height={ROAD_TOP + 5} fill="url(#skyG)" />

        {/* Sun */}
        <circle cx="820" cy="52" r="38" fill="#FFC107" opacity="0.95" />
        <circle cx="820" cy="52" r="30" fill="#FFD54F" />

        {/* Cloud left */}
        <g opacity="0.88">
          <ellipse cx="130" cy="58" rx="58" ry="22" fill="white" />
          <ellipse cx="170" cy="50" rx="44" ry="17" fill="white" />
          <ellipse cx="92"  cy="63" rx="34" ry="15" fill="white" />
        </g>

        {/* Cloud right-center */}
        <g opacity="0.72">
          <ellipse cx="560" cy="62" rx="62" ry="21" fill="white" />
          <ellipse cx="598" cy="54" rx="46" ry="17" fill="white" />
          <ellipse cx="520" cy="67" rx="35" ry="15" fill="white" />
        </g>

        {/* ── Hills at horizon ── */}
        <ellipse cx="130"  cy={ROAD_TOP + 4} rx="210" ry="36" fill="#81C784" opacity="0.55" />
        <ellipse cx="720"  cy={ROAD_TOP + 4} rx="245" ry="33" fill="#A5D6A7" opacity="0.45" />
        <ellipse cx="420"  cy={ROAD_TOP + 5} rx="175" ry="28" fill="#66BB6A" opacity="0.38" />

        {/* ── Ground strip ── */}
        <rect y={ROAD_TOP - 8} width="900" height="12" fill="#8BC34A" opacity="0.35" />

        {/* ── Road surface ── */}
        <rect y={ROAD_TOP} width="900" height={260 - ROAD_TOP} fill="#9E9E9E" />
        <rect y={ROAD_TOP} width="900" height="4"               fill="#6E6E6E" />

        {/* ── Center yellow dashes ── */}
        {Array.from({ length: 17 }, (_, i) => (
          <rect key={i} x={i * 58} y={dashY} width={dashW} height={dashH} rx="2" fill="#FFC107" />
        ))}

        {/* ── Shoulder edge line ── */}
        <line x1="0" y1={ROAD_TOP + 2} x2="900" y2={ROAD_TOP + 2} stroke="#E0E0E0" strokeWidth="2" opacity="0.5" />

        {/* ── Speed-motion lines (car just came from left) ── */}
        <line x1="20"  y1={WHEEL_CY - 28} x2="130" y2={WHEEL_CY - 28} stroke="white" strokeWidth="1.5" opacity="0.22" />
        <line x1="8"   y1={WHEEL_CY - 18} x2="140" y2={WHEEL_CY - 18} stroke="white" strokeWidth="2"   opacity="0.15" />
        <line x1="30"  y1={WHEEL_CY - 10} x2="138" y2={WHEEL_CY - 10} stroke="white" strokeWidth="1"   opacity="0.18" />

        {/* ════════════════════════════════════════ */}
        {/* 2008 Toyota RAV4 — white, heading right */}
        {/* ════════════════════════════════════════ */}

        {/* Car shadow */}
        <ellipse cx="265" cy={GROUND_Y + 2} rx="112" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* --- Rear spare tire (distinctive RAV4 feature) --- */}
        <SpareTire cx={CAR_REAR + 2} cy={BODY_BOT - 17} />

        {/* --- Lower body (boxy SUV sill/door area) --- */}
        <rect
          x={BODY_REAR} y={WIN_SILL}
          width={BODY_FRONT - BODY_REAR} height={BODY_BOT - WIN_SILL}
          rx="4" fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* --- Cabin / greenhouse --- */}
        {/*  C-pillar almost vertical (RAV4 style), A-pillar moderately raked */}
        <path
          d={`M ${BODY_REAR + 18},${WIN_SILL}
              L ${BODY_REAR + 20},${ROOF_Y}
              L ${BODY_FRONT - 62},${ROOF_Y}
              L ${BODY_FRONT - 38},${WIN_SILL} Z`}
          fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* Rear window (upright, characteristic of 2008 RAV4) */}
        <path
          d={`M ${BODY_REAR + 24},${WIN_SILL - 1}
              L ${BODY_REAR + 26},${ROOF_Y + 3}
              L ${BODY_REAR + 68},${ROOF_Y + 3}
              L ${BODY_REAR + 68},${WIN_SILL - 1} Z`}
          fill="#90CAF9" opacity="0.70"
        />

        {/* B-pillar */}
        <rect
          x={BODY_REAR + 68} y={ROOF_Y + 2}
          width="5" height={WIN_SILL - ROOF_Y - 1}
          rx="1" fill="#C8C8C8"
        />

        {/* Front window (slightly raked A-pillar) */}
        <path
          d={`M ${BODY_REAR + 77},${WIN_SILL - 1}
              L ${BODY_REAR + 77},${ROOF_Y + 3}
              L ${BODY_FRONT - 65},${ROOF_Y + 3}
              L ${BODY_FRONT - 42},${WIN_SILL - 1} Z`}
          fill="#90CAF9" opacity="0.70"
        />

        {/* Roof rails */}
        <rect x={BODY_REAR + 36} y={ROOF_Y - 2} width="110" height="3" rx="1.5" fill="#CACACA" />
        {/* Rail mounts */}
        <rect x={BODY_REAR + 46} y={ROOF_Y - 4} width="8" height="5" rx="1.5" fill="#B0B0B0" />
        <rect x={BODY_REAR + 128} y={ROOF_Y - 4} width="8" height="5" rx="1.5" fill="#B0B0B0" />

        {/* Hood (slight downward slope from A-pillar to front bumper) */}
        <path
          d={`M ${BODY_FRONT - 38},${WIN_SILL}
              L ${BODY_FRONT + 2},${WIN_SILL + 3}
              L ${BODY_FRONT + 2},${WIN_SILL + 12}
              L ${BODY_FRONT - 38},${WIN_SILL + 12} Z`}
          fill="white" stroke="#D8D8D8" strokeWidth="1.5"
        />

        {/* Front bumper */}
        <rect x={BODY_FRONT} y={WIN_SILL + 1} width="8" height={BODY_BOT - WIN_SILL - 1} rx="3" fill="#CCCCCC" />

        {/* Front headlights */}
        <rect x={BODY_FRONT - 5} y={WIN_SILL + 4} width="11" height="9" rx="2" fill="#FFFDE7" stroke="#F9A825" strokeWidth="1" />
        {/* Daytime running light strip */}
        <rect x={BODY_FRONT - 4} y={WIN_SILL + 15} width="9" height="3" rx="1.5" fill="#FFF9C4" opacity="0.8" />

        {/* Front grille */}
        <rect x={BODY_FRONT - 1} y={WIN_SILL + 20} width="6" height="10" rx="2" fill="#D0D0D0" />

        {/* Rear bumper */}
        <rect x={BODY_REAR - 2} y={WIN_SILL + 1} width="7" height={BODY_BOT - WIN_SILL - 1} rx="2" fill="#CCCCCC" />

        {/* Taillights */}
        <rect x={BODY_REAR + 1} y={WIN_SILL + 3} width="9" height="14" rx="2" fill="#EF9A9A" />
        <rect x={BODY_REAR + 1} y={WIN_SILL + 19} width="6" height="6" rx="1" fill="#FFCCBC" />

        {/* Body side trim line */}
        <line
          x1={BODY_REAR + 8} y1={WIN_SILL + 14}
          x2={BODY_FRONT - 4} y2={WIN_SILL + 14}
          stroke="#D0D0D0" strokeWidth="2"
        />

        {/* Side mirror (on A-pillar, driver's side) */}
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

        {/* Wheel well arches */}
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

        {/* Wheels */}
        <Wheel cx={REAR_WHL_X} cy={WHEEL_CY} />
        <Wheel cx={FRNT_WHL_X} cy={WHEEL_CY} />

        {/* ── Utility poles ── */}
        <line x1="55"  y1="120" x2="55"  y2={ROAD_TOP} stroke="#757575" strokeWidth="4" />
        <line x1="37"  y1="132" x2="73"  y2="132"      stroke="#757575" strokeWidth="2.5" />
        <line x1="560" y1="135" x2="560" y2={ROAD_TOP} stroke="#757575" strokeWidth="3.5" />
        <line x1="544" y1="145" x2="576" y2="145"      stroke="#757575" strokeWidth="2" />
        <line x1="700" y1="140" x2="700" y2={ROAD_TOP} stroke="#757575" strokeWidth="3" />
        <line x1="686" y1="149" x2="714" y2="149"      stroke="#757575" strokeWidth="1.5" />
        <line x1="840" y1="145" x2="840" y2={ROAD_TOP} stroke="#757575" strokeWidth="3.5" />
        <line x1="824" y1="155" x2="856" y2="155"      stroke="#757575" strokeWidth="2" />

        {/* ── Power wires (sagging between crossbar ends) ── */}
        {/* Pole 1 (55) → Pole 2 (560): left wire */}
        <path d="M 37,132 Q 290,151 544,145" fill="none" stroke="#5A5A5A" strokeWidth="1.2" />
        {/* Pole 1 (55) → Pole 2 (560): right wire */}
        <path d="M 73,132 Q 324,151 576,145" fill="none" stroke="#5A5A5A" strokeWidth="1.2" />
        {/* Pole 2 (560) → Pole 3 (700): left wire */}
        <path d="M 544,145 Q 615,157 686,149" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        {/* Pole 2 (560) → Pole 3 (700): right wire */}
        <path d="M 576,145 Q 645,157 714,149" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        {/* Pole 3 (700) → Pole 4 (840): left wire */}
        <path d="M 686,149 Q 755,163 824,155" fill="none" stroke="#5A5A5A" strokeWidth="1" />
        {/* Pole 3 (700) → Pole 4 (840): right wire */}
        <path d="M 714,149 Q 785,163 856,155" fill="none" stroke="#5A5A5A" strokeWidth="1" />
      </svg>
    </div>
  )
}
