import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps'
import { STATE_ELECTRICITY_RATES } from '../data/electricityRates'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// Green (cheap) → yellow → orange → red (expensive)
const COLOR_STOPS = [
  { t: 0.00, rgb: [27,  94,  32]  },  // deep green   — cheapest (~$0.08)
  { t: 0.22, rgb: [56, 142,  60]  },  // green
  { t: 0.42, rgb: [139, 195, 74]  },  // light green
  { t: 0.57, rgb: [255, 235, 59]  },  // yellow       (bridge)
  { t: 0.72, rgb: [255, 152,  0]  },  // orange
  { t: 0.87, rgb: [244,  67, 54]  },  // red
  { t: 1.00, rgb: [136,  14, 79]  },  // deep red/purple — most expensive (~$0.39)
]

const MIN_RATE = 0.08
const MAX_RATE = 0.39

const STATE_LABELS = {
  Alabama:                { coords: [-86.8,  32.8],  size: 8   },
  Alaska:                 { coords: [-153.4, 64.2],  size: 9.5 },
  Arizona:                { coords: [-111.7, 34.3],  size: 10.5},
  Arkansas:               { coords: [-92.4,  34.9],  size: 8   },
  California:             { coords: [-120.8, 37.5],  size: 9   },
  Colorado:               { coords: [-105.5, 39.0],  size: 9.5 },
  Connecticut:            null,
  Delaware:               null,
  'District of Columbia': null,
  Florida:                { coords: [-82.0,  28.5],  size: 8.5 },
  Georgia:                { coords: [-83.4,  32.6],  size: 8.5 },
  Hawaii:                 { coords: [-155.5, 19.7],  size: 7   },
  Idaho:                  { coords: [-114.3, 44.5],  size: 8   },
  Illinois:               { coords: [-89.2,  40.0],  size: 8   },
  Indiana:                { coords: [-86.3,  40.0],  size: 7.5 },
  Iowa:                   { coords: [-93.5,  42.1],  size: 8   },
  Kansas:                 { coords: [-98.4,  38.5],  size: 8.5 },
  Kentucky:               { coords: [-85.8,  37.6],  size: 7   },
  Louisiana:              { coords: [-92.0,  31.5],  size: 7.5 },
  Maine:                  { coords: [-69.4,  45.2],  size: 7   },
  Maryland:               null,
  Massachusetts:          null,
  Michigan:               { coords: [-84.5,  44.0],  size: 8   },
  Minnesota:              { coords: [-94.4,  46.4],  size: 8.5 },
  Mississippi:            { coords: [-89.7,  32.7],  size: 7.5 },
  Missouri:               { coords: [-92.5,  38.4],  size: 8   },
  Montana:                { coords: [-110.4, 47.0],  size: 10.5},
  Nebraska:               { coords: [-99.9,  41.5],  size: 8   },
  Nevada:                 { coords: [-116.8, 39.5],  size: 8.5 },
  'New Hampshire':        null,
  'New Jersey':           null,
  'New Mexico':           { coords: [-106.1, 34.3],  size: 10  },
  'New York':             { coords: [-75.8,  42.8],  size: 8   },
  'North Carolina':       { coords: [-79.7,  35.4],  size: 7.5 },
  'North Dakota':         { coords: [-100.5, 47.5],  size: 8.5 },
  Ohio:                   { coords: [-82.8,  40.4],  size: 8   },
  Oklahoma:               { coords: [-97.5,  35.5],  size: 8   },
  Oregon:                 { coords: [-120.5, 44.0],  size: 8.5 },
  Pennsylvania:           { coords: [-77.5,  40.9],  size: 8   },
  'Rhode Island':         null,
  'South Carolina':       { coords: [-80.9,  33.8],  size: 7.5 },
  'South Dakota':         { coords: [-100.2, 44.5],  size: 8.5 },
  Tennessee:              { coords: [-86.3,  35.9],  size: 7   },
  Texas:                  { coords: [-99.3,  31.4],  size: 13  },
  Utah:                   { coords: [-111.5, 39.5],  size: 8   },
  Vermont:                null,
  Virginia:               { coords: [-79.5,  37.8],  size: 7.5 },
  Washington:             { coords: [-120.5, 47.4],  size: 8   },
  'West Virginia':        { coords: [-80.6,  38.7],  size: 6.5 },
  Wisconsin:              { coords: [-89.6,  44.5],  size: 8   },
  Wyoming:                { coords: [-107.6, 43.0],  size: 8.5 },
}

const DEFAULT_CENTER = [-97, 38]
const DEFAULT_ZOOM   = 1

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function rateColor(rate) {
  if (!rate) return '#78909C'
  const t = Math.max(0, Math.min(1, (rate - MIN_RATE) / (MAX_RATE - MIN_RATE)))
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i], b = COLOR_STOPS[i + 1]
    if (t <= b.t) {
      const lt = (t - a.t) / (b.t - a.t)
      return `rgb(${lerp(a.rgb[0],b.rgb[0],lt)},${lerp(a.rgb[1],b.rgb[1],lt)},${lerp(a.rgb[2],b.rgb[2],lt)})`
    }
  }
  const last = COLOR_STOPS.at(-1).rgb
  return `rgb(${last.join(',')})`
}

// Format $/kWh as cents string for compact map labels: 0.138 → "14¢"
function toCents(rate) { return `${Math.round(rate * 100)}¢` }

export default function ElectricityRateMap({ selectedState, electricityRate }) {
  const [tooltip, setTooltip] = useState(null)
  const [tapInfo, setTapInfo] = useState(null)
  const [zoom,    setZoom]    = useState(DEFAULT_ZOOM)
  const [center,  setCenter]  = useState(DEFAULT_CENTER)

  const isMobile = window.innerWidth < 640

  const hour   = new Date().getHours()
  const isDark = hour >= 19 || hour < 6

  const enteredRate  = electricityRate ? parseFloat(electricityRate) : NaN
  const displayRate  = !isNaN(enteredRate) ? enteredRate : STATE_ELECTRICITY_RATES[selectedState]

  function handleZoomIn()  { setZoom(z => Math.min(z * 1.5, 8)) }
  function handleZoomOut() { setZoom(z => Math.max(z / 1.5, 1)) }
  function handleReset()   { setZoom(DEFAULT_ZOOM); setCenter(DEFAULT_CENTER) }

  const borderNormal   = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.22)'
  const borderSelected = '#69F0AE'

  return (
    <section className={`gas-map-section${isDark ? '' : ' gas-map-section--light'}`}>

      <div className="gas-map-header">
        <div>
          <h2 className="gas-map-title">Electricity Rates by State</h2>
          <p className="gas-map-sub">2024 annual averages · Source: EIA</p>
        </div>

        {selectedState && displayRate ? (
          <div className="gas-map-callout">
            <div className="gas-map-callout-state">{selectedState}</div>
            <div className="gas-map-callout-price">
              ${displayRate.toFixed(3)}<span>/kWh</span>
            </div>
          </div>
        ) : (
          <div className="gas-map-hint">
            Select a state above to highlight your local rate
          </div>
        )}
      </div>

      <div className="gas-map-wrap">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 900 }}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ zoom: z, coordinates }) => {
              setZoom(z)
              setCenter(coordinates)
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const name       = geo.properties.name
                  const rate       = STATE_ELECTRICITY_RATES[name]
                  const isSelected = name === selectedState
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={rateColor(rate)}
                      stroke={isSelected ? borderSelected : borderNormal}
                      strokeWidth={isSelected ? 3 / zoom : 0.9 / zoom}
                      onClick={isMobile ? () =>
                        setTapInfo(t => t?.name === name ? null : { name, rate })
                      : undefined}
                      onMouseEnter={isMobile ? undefined : e =>
                        setTooltip({ name, rate, x: e.clientX, y: e.clientY })
                      }
                      onMouseMove={isMobile ? undefined : e =>
                        setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
                      }
                      onMouseLeave={isMobile ? undefined : () => setTooltip(null)}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', opacity: isMobile ? 1 : 0.72 },
                        pressed: { outline: 'none', opacity: 0.85 },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {!isMobile && Object.entries(STATE_LABELS).map(([name, info]) => {
              if (!info) return null
              const rate = STATE_ELECTRICITY_RATES[name]
              if (!rate) return null
              const pw = info.size * 3.2
              const ph = info.size * 1.5
              return (
                <Marker key={name} coordinates={info.coords}>
                  <rect
                    x={-pw / 2}
                    y={-ph / 2}
                    width={pw}
                    height={ph}
                    rx={ph / 2}
                    fill="white"
                    fillOpacity={0.93}
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth={info.size * 0.08}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={info.size}
                    fontWeight="800"
                    fill="#1A1A2E"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {toCents(rate)}
                  </text>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        <div className="gas-map-zoom">
          <button onClick={handleZoomIn}  aria-label="Zoom in">+</button>
          <button onClick={handleZoomOut} aria-label="Zoom out">&#8722;</button>
          {zoom > 1 && (
            <button onClick={handleReset} className="gas-map-reset" aria-label="Reset zoom">
              &#8635;
            </button>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="gas-map-mobile-bar">
          {tapInfo ? (
            <>
              <span className="gas-map-mobile-name">{tapInfo.name}</span>
              <span className="gas-map-mobile-price">
                {tapInfo.rate != null ? `${toCents(tapInfo.rate)}/kWh` : 'No data'}
              </span>
            </>
          ) : (
            <span className="gas-map-mobile-hint">Tap any state to see its rate</span>
          )}
        </div>
      )}

      <div className="gas-map-legend">
        <span className="gas-map-legend-end">Cheaper</span>
        <div className="gas-map-gradient gas-map-gradient--electric" aria-hidden="true" />
        <span className="gas-map-legend-end">Expensive</span>
        <span className="gas-map-legend-sep" aria-hidden="true" />
        <span className="gas-map-legend-note">Scroll to zoom · Drag to pan</span>
      </div>

      {!isMobile && tooltip && (
        <div
          className="gas-map-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 56 }}
          aria-hidden="true"
        >
          <strong>{tooltip.name}</strong>
          {tooltip.rate && <span>{toCents(tooltip.rate)}/kWh (${tooltip.rate.toFixed(3)})</span>}
        </div>
      )}

    </section>
  )
}
