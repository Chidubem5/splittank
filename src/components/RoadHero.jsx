// RoadHero.jsx — the road scene banner at the top of the page.
//
// A deliberately simple, child-like drawing (thick round outlines, flat
// fills): a car carrying four riders drives past lollipop trees and utility
// poles on a two-lane road. At night (see hooks/useNightMode.js) the sun
// becomes a moon, stars come out and the headlights switch on.
//
// Sizing: the car sits in the middle of a 1280×200 drawing. The scenery
// (trees, poles, clouds, hills, road) repeats every 1280 units to the left
// and right. The banner measures itself and widens the viewBox to match its
// own aspect ratio, so on wide screens you see more countryside at the same
// scale instead of a zoomed-in crop; on narrow screens (slice) the sides are
// cropped and the car stays centred.

import { useEffect, useRef, useState } from 'react'

const DAY = {
  sky: '#29B6F6', sun: '#FFC107', cloud: '#FFFFFF', hill: '#9CCC65', grass: '#66BB6A',
  tree: '#43A047', tree2: '#2E7D32', wood: '#795548', wire: '#1A1A2E',
  road: '#5A5F6B', edge: '#FFFFFF', car: '#FFFFFF', glass: '#B3E5FC', ink: '#1A1A2E',
}
const NIGHT = {
  sky: '#16203A', sun: '#FFE082', cloud: '#26314F', hill: '#2E4A33', grass: '#2F5D34',
  tree: '#3E8E41', tree2: '#2E6B32', wood: '#8D6E63', wire: '#9AA3BA',
  road: '#2A2F3D', edge: '#8A93AD', car: '#E3E8EF', glass: '#5CCBFA', ink: '#0B0F1C',
}

const OUTLINE = 2 // stroke width of the coloring-book outline

const TILE = 1280                       // scenery repeats every TILE units
const TILES = [-2, -1, 0, 1, 2]          // covers viewports up to ~5× wider than tall×6.4
const SPAN = { x: -2700, w: 6700 }       // sky / grass / road extent
const POLES = Array.from({ length: 21 }, (_, i) => -2800 + i * 320 + 80)
const STARS = [[300, 30, 2], [455, 58, 1.6], [560, 22, 2], [980, 30, 1.6], [1060, 18, 2], [180, 84, 1.4], [1180, 52, 1.6], [700, 36, 1.4]]
// One tile of trees: [x, kind, radius]
const TREES = [[30, 'tree', 20], [210, 'tree', 24], [300, 'bush'], [486, 'tree', 22], [850, 'bush'], [940, 'tree', 26], [1170, 'bush']]
const HILL = 'M-200 128 C-80 104 20 98 120 122 S350 100 470 122 S700 96 820 120 S1060 92 1180 116 S1400 104 1480 114 V146 H-200 Z'

// Viewbox wide enough to match the banner's own aspect ratio (never narrower
// than the 1280-unit drawing), centred on the car.
function useSceneViewBox() {
  const ref = useRef(null)
  const [w, setW] = useState(TILE)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setW(Math.max(TILE, Math.round((width * 200) / height)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, `${TILE / 2 - w / 2} 0 ${w} 200`]
}
const RIDERS = [
  { x: 615, skin: '#8D5524', hair: '#1A1A2E', shirt: '#43A047', style: 'bun' },
  { x: 635, skin: '#FFDBAC', hair: '#B5651D', shirt: '#FFC107', style: 'long' },
  { x: 667, skin: '#C68642', hair: '#2B1B12', shirt: '#0288D1', style: 'short' },
  { x: 688, skin: '#F1C27D', hair: '#4E342E', shirt: '#FF8A65', style: 'short' },
]
const BACK_WINDOW  = 'M594 144 L612 110 H648 V144 Z'
const FRONT_WINDOW = 'M654 144 V110 H696 L718 144 Z'

function Cloud({ x, y, c }) {
  return (
    <path
      d={`M${x} ${y} a13 13 0 0 1 9 -23 a18 18 0 0 1 33 -5 a14 14 0 0 1 22 15 a10 10 0 0 1 -5 13 z`}
      fill={c.cloud} stroke={c.ink} strokeWidth={OUTLINE} strokeLinejoin="round"
    />
  )
}

// Round "lollipop" tree
function Tree({ x, r = 24, c }) {
  return (
    <g stroke={c.ink} strokeWidth={OUTLINE} strokeLinejoin="round">
      <rect x={x - 4} y={108} width={8} height={34} rx={3} fill={c.wood} />
      <circle cx={x} cy={116 - r} r={r} fill={c.tree} />
    </g>
  )
}

// Lumpy, cloud-shaped tree
function BushyTree({ x, c }) {
  return (
    <g stroke={c.ink} strokeWidth={OUTLINE} strokeLinejoin="round">
      <rect x={x - 4} y={110} width={8} height={32} rx={3} fill={c.wood} />
      <path d={`M${x - 26} 104 a14 14 0 0 1 6 -24 a17 17 0 0 1 30 -8 a15 15 0 0 1 18 22 a12 12 0 0 1 -6 14 z`} fill={c.tree2} />
    </g>
  )
}

function Pole({ x, c }) {
  return (
    <g>
      <g stroke={c.wood} strokeLinecap="round">
        <line x1={x} y1={62} x2={x} y2={142} strokeWidth={6} />
        <line x1={x - 22} y1={73} x2={x + 22} y2={73} strokeWidth={5} />
      </g>
      <circle cx={x - 16} cy={70} r={3} fill={c.ink} />
      <circle cx={x + 16} cy={70} r={3} fill={c.ink} />
    </g>
  )
}

// Sagging wires strung between neighbouring poles
function Wires({ c }) {
  const paths = []
  for (let i = 0; i < POLES.length - 1; i++) {
    const a = POLES[i], b = POLES[i + 1]
    for (const d of [-16, 16]) {
      paths.push(<path key={`${i}${d}`} d={`M${a + d} 70 Q${(a + b) / 2 + d} 89 ${b + d} 70`} />)
    }
  }
  return <g fill="none" stroke={c.wire} strokeWidth={1.8}>{paths}</g>
}

function SunOrMoon({ night, c }) {
  const cx = 840, cy = 40
  if (night) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={22} fill={c.sun} stroke={c.ink} strokeWidth={OUTLINE} />
        <circle cx={cx + 10} cy={cy - 7} r={19} fill={c.sky} />
      </g>
    )
  }
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return (
      <line key={i}
        x1={cx + 30 * Math.cos(a)} y1={cy + 30 * Math.sin(a)}
        x2={cx + 39 * Math.cos(a)} y2={cy + 39 * Math.sin(a)} />
    )
  })
  return (
    <g>
      <g stroke={c.sun} strokeWidth={4.5} strokeLinecap="round">{rays}</g>
      <circle cx={cx} cy={cy} r={22} fill={c.sun} stroke={c.ink} strokeWidth={OUTLINE} />
    </g>
  )
}

// One rider: shirt, head, hair, dot eyes and a smile
function Rider({ x, skin, hair, shirt, style }) {
  const y = 128
  return (
    <g>
      <rect x={x - 10} y={y + 7} width={20} height={16} rx={7} fill={shirt} stroke="#1A1A2E" strokeWidth={1.6} />
      {style === 'long' && <path d={`M${x - 9.5} ${y + 7} V${y - 1} A9.5 9.5 0 0 1 ${x + 9.5} ${y - 1} V${y + 7} Z`} fill={hair} />}
      <circle cx={x} cy={y} r={8.5} fill={skin} stroke="#1A1A2E" strokeWidth={1.6} />
      {style === 'bun' && <circle cx={x} cy={y - 10} r={4} fill={hair} />}
      <path d={`M${x - 8.6} ${y - 1} A8.6 8.6 0 0 1 ${x + 8.6} ${y - 1} Q${x + 2} ${y - 5.5} ${x - 8.6} ${y - 1} Z`} fill={hair} />
      <circle cx={x - 3} cy={y + 1.5} r={1.2} fill="#1A1A2E" />
      <circle cx={x + 3} cy={y + 1.5} r={1.2} fill="#1A1A2E" />
      <path d={`M${x - 3} ${y + 4.5} Q${x} ${y + 7} ${x + 3} ${y + 4.5}`} fill="none" stroke="#1A1A2E" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  )
}

function Car({ night, c }) {
  return (
    <g>
      {night && <path d="M748 156 L930 132 L930 192 Z" fill={c.sun} opacity={0.28} />}
      <g stroke={c.edge} strokeWidth={3} strokeLinecap="round">
        <line x1={512} y1={158} x2={536} y2={158} />
        <line x1={500} y1={168} x2={532} y2={168} />
        <line x1={516} y1={178} x2={536} y2={178} />
      </g>
      <path d="M580 148 L604 104 H700 L730 148 Z" fill={c.car} stroke={c.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={BACK_WINDOW} fill={c.glass} />
      <path d={FRONT_WINDOW} fill={c.glass} />
      <defs>
        <clipPath id="road-hero-windows">
          <path d={BACK_WINDOW} />
          <path d={FRONT_WINDOW} />
        </clipPath>
      </defs>
      <g clipPath="url(#road-hero-windows)">
        {RIDERS.map(r => <Rider key={r.x} {...r} />)}
      </g>
      <rect x={548} y={146} width={204} height={36} rx={16} fill={c.car} stroke={c.ink} strokeWidth={OUTLINE} />
      <circle cx={744} cy={158} r={4.5} fill={c.sun} />
      <rect x={551} y={154} width={5} height={9} rx={2} fill="#EF5350" />
      {[596, 704].map(x => (
        <g key={x}>
          <circle cx={x} cy={184} r={16} fill="#1A1A2E" />
          <circle cx={x} cy={184} r={6} fill="#C8CDD5" />
        </g>
      ))}
    </g>
  )
}

export default function RoadHero({ night = false }) {
  const c = night ? NIGHT : DAY
  const [ref, viewBox] = useSceneViewBox()
  return (
    <div className="road-hero" ref={ref}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMax slice"
        role="img"
        aria-label={`A car with four people drives past trees and utility poles on a two-lane road${night ? ' at night, headlights on' : ''}`}
      >
        <rect x={SPAN.x} width={SPAN.w} height={200} fill={c.sky} />
        {night && (
          <g fill="#FFFFFF">
            {TILES.flatMap(t => STARS.map(([x, y, r]) => <circle key={`${t}-${x}`} cx={x + t * TILE} cy={y} r={r} />))}
          </g>
        )}
        <SunOrMoon night={night} c={c} />
        {TILES.map(t => (
          <g key={t} transform={`translate(${t * TILE} 0)`}>
            <Cloud x={440} y={56} c={c} />
            <Cloud x={1010} y={58} c={c} />
            <Cloud x={130} y={52} c={c} />
            <path d={HILL} fill={c.hill} />
          </g>
        ))}
        <Wires c={c} />
        {POLES.map(x => <Pole key={x} x={x} c={c} />)}
        {TILES.flatMap(t => TREES.map(([x, kind, r]) => kind === 'bush'
          ? <BushyTree key={`${t}-${x}`} x={x + t * TILE} c={c} />
          : <Tree key={`${t}-${x}`} x={x + t * TILE} r={r} c={c} />))}
        <rect x={SPAN.x} y={138} width={SPAN.w} height={10} fill={c.grass} />
        <rect x={SPAN.x} y={146} width={SPAN.w} height={54} fill={c.road} />
        <line x1={SPAN.x} y1={150} x2={SPAN.x + SPAN.w} y2={150} stroke={c.edge} strokeWidth={3} />
        <line x1={SPAN.x} y1={176} x2={SPAN.x + SPAN.w} y2={176} stroke="#FFC107" strokeWidth={5} strokeDasharray="34 26" />
        <Car night={night} c={c} />
      </svg>
    </div>
  )
}
