const EIA_KEY = import.meta.env.VITE_EIA_API_KEY
const CACHE_TTL = 86_400_000 // 24 hours

const STATE_AREA = {
  Alabama: 'SAL', Alaska: 'SAK', Arizona: 'SAZ', Arkansas: 'SAR',
  California: 'SCA', Colorado: 'SCO', Connecticut: 'SCT', Delaware: 'SDE',
  'District of Columbia': 'SDC', Florida: 'SFL', Georgia: 'SGA',
  Hawaii: 'SHI', Idaho: 'SID', Illinois: 'SIL', Indiana: 'SIN',
  Iowa: 'SIA', Kansas: 'SKS', Kentucky: 'SKY', Louisiana: 'SLA',
  Maine: 'SME', Maryland: 'SMD', Massachusetts: 'SMA', Michigan: 'SMI',
  Minnesota: 'SMN', Mississippi: 'SMS', Missouri: 'SMO', Montana: 'SMT',
  Nebraska: 'SNE', Nevada: 'SNV', 'New Hampshire': 'SNH', 'New Jersey': 'SNJ',
  'New Mexico': 'SNM', 'New York': 'SNY', 'North Carolina': 'SNC',
  'North Dakota': 'SND', Ohio: 'SOH', Oklahoma: 'SOK', Oregon: 'SOR',
  Pennsylvania: 'SPA', 'Rhode Island': 'SRI', 'South Carolina': 'SSC',
  'South Dakota': 'SSD', Tennessee: 'STN', Texas: 'STX', Utah: 'SUT',
  Vermont: 'SVT', Virginia: 'SVA', Washington: 'SWA', 'West Virginia': 'SWV',
  Wisconsin: 'SWI', Wyoming: 'SWY',
}

// States without direct EIA weekly survey fall back to their PADD sub-region
// (sub-regions R1X/R1Y/R1Z give more accuracy than the full PADD 1 R10)
const PADD_FALLBACK = {
  // PADD 1A — New England
  SCT: 'R1X', SME: 'R1X', SNH: 'R1X', SRI: 'R1X', SVT: 'R1X',
  // PADD 1B — Central Atlantic
  SDC: 'R1Y', SDE: 'R1Y', SMD: 'R1Y', SNJ: 'R1Y', SPA: 'R1Y',
  // PADD 1C — Lower Atlantic  (FL has direct state data)
  SGA: 'R1Z', SNC: 'R1Z', SSC: 'R1Z', SVA: 'R1Z', SWV: 'R1Z',
  // PADD 2 — Midwest          (MN, OH have direct state data)
  SIL: 'R20', SIN: 'R20', SIA: 'R20', SKS: 'R20', SKY: 'R20',
  SMI: 'R20', SMO: 'R20', SNE: 'R20', SND: 'R20', SOK: 'R20',
  SSD: 'R20', STN: 'R20', SWI: 'R20',
  // PADD 3 — Gulf Coast        (TX has direct state data)
  SAL: 'R30', SAR: 'R30', SLA: 'R30', SMS: 'R30', SNM: 'R30',
  // PADD 4 — Rocky Mountain    (CO has direct state data)
  SID: 'R40', SMT: 'R40', SUT: 'R40', SWY: 'R40',
  // PADD 5 — West Coast        (CA, WA have direct state data)
  SAK: 'R50', SAZ: 'R50', SHI: 'R50', SNV: 'R50', SOR: 'R50',
}

// EIA metro area codes — more granular than state for 10 major cities
const METRO_LABELS = {
  YBOS: 'Boston metro',      YORD: 'Chicago metro',
  YCLE: 'Cleveland metro',   YDEN: 'Denver metro',
  Y44HO: 'Houston metro',    Y05LA: 'Los Angeles metro',
  YMIA: 'Miami metro',       Y35NY: 'New York City metro',
  Y05SF: 'San Francisco metro', Y48SE: 'Seattle metro',
}

// county (normalized, no "County"/"Parish") + "|" + full state name → metro code
const COUNTY_METRO = {
  // Chicago metro — IL
  'cook|Illinois': 'YORD', 'dupage|Illinois': 'YORD',
  'lake|Illinois': 'YORD', 'will|Illinois': 'YORD',
  'kane|Illinois': 'YORD', 'mchenry|Illinois': 'YORD',
  'kendall|Illinois': 'YORD',
  // Los Angeles metro — CA
  'los angeles|California': 'Y05LA', 'orange|California': 'Y05LA',
  'ventura|California': 'Y05LA',
  // San Francisco metro — CA
  'san francisco|California': 'Y05SF', 'san mateo|California': 'Y05SF',
  'alameda|California': 'Y05SF', 'contra costa|California': 'Y05SF',
  'marin|California': 'Y05SF', 'santa clara|California': 'Y05SF',
  'napa|California': 'Y05SF', 'sonoma|California': 'Y05SF',
  'solano|California': 'Y05SF',
  // Miami metro — FL
  'miami-dade|Florida': 'YMIA', 'broward|Florida': 'YMIA',
  'palm beach|Florida': 'YMIA',
  // New York City metro — NY + NJ
  'new york|New York': 'Y35NY', 'kings|New York': 'Y35NY',
  'queens|New York': 'Y35NY', 'bronx|New York': 'Y35NY',
  'richmond|New York': 'Y35NY', 'nassau|New York': 'Y35NY',
  'westchester|New York': 'Y35NY', 'rockland|New York': 'Y35NY',
  'suffolk|New York': 'Y35NY',
  'bergen|New Jersey': 'Y35NY', 'hudson|New Jersey': 'Y35NY',
  'essex|New Jersey': 'Y35NY', 'union|New Jersey': 'Y35NY',
  'middlesex|New Jersey': 'Y35NY', 'passaic|New Jersey': 'Y35NY',
  'morris|New Jersey': 'Y35NY', 'somerset|New Jersey': 'Y35NY',
  // Houston metro — TX
  'harris|Texas': 'Y44HO', 'fort bend|Texas': 'Y44HO',
  'montgomery|Texas': 'Y44HO', 'brazoria|Texas': 'Y44HO',
  'galveston|Texas': 'Y44HO', 'liberty|Texas': 'Y44HO',
  'waller|Texas': 'Y44HO', 'chambers|Texas': 'Y44HO',
  // Denver metro — CO
  'denver|Colorado': 'YDEN', 'arapahoe|Colorado': 'YDEN',
  'jefferson|Colorado': 'YDEN', 'adams|Colorado': 'YDEN',
  'douglas|Colorado': 'YDEN', 'boulder|Colorado': 'YDEN',
  'broomfield|Colorado': 'YDEN', 'elbert|Colorado': 'YDEN',
  // Boston metro — MA
  'suffolk|Massachusetts': 'YBOS', 'middlesex|Massachusetts': 'YBOS',
  'norfolk|Massachusetts': 'YBOS', 'essex|Massachusetts': 'YBOS',
  'plymouth|Massachusetts': 'YBOS',
  // Cleveland metro — OH
  'cuyahoga|Ohio': 'YCLE', 'summit|Ohio': 'YCLE',
  'lorain|Ohio': 'YCLE', 'lake|Ohio': 'YCLE',
  'medina|Ohio': 'YCLE', 'portage|Ohio': 'YCLE',
  'geauga|Ohio': 'YCLE',
  // Seattle metro — WA
  'king|Washington': 'Y48SE', 'snohomish|Washington': 'Y48SE',
  'pierce|Washington': 'Y48SE', 'kitsap|Washington': 'Y48SE',
  'thurston|Washington': 'Y48SE',
}

// Strip "County" / "Parish" / "Borough" etc. and lowercase for COUNTY_METRO lookup
export function normalizeCounty(county) {
  return county
    .toLowerCase()
    .replace(/\s+county$/, '')
    .replace(/\s+parish$/, '')
    .replace(/\s+borough$/, '')
    .replace(/\s+census area$/, '')
    .replace(/\s+municipality$/, '')
    .trim()
}

function getCached(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (Date.now() - c.t < CACHE_TTL) return { price: c.price, period: c.period, label: c.label }
  } catch {}
  return null
}

function setCached(key, result) {
  try {
    localStorage.setItem(key, JSON.stringify({
      price: result.price, period: result.period, label: result.label ?? null, t: Date.now(),
    }))
  } catch {}
}

async function fetchArea(area) {
  const url =
    `https://api.eia.gov/v2/petroleum/pri/gnd/data/` +
    `?api_key=${EIA_KEY}` +
    `&frequency=weekly` +
    `&data[0]=value` +
    `&facets[product][]=EPM0` +
    `&facets[duoarea][]=${area}` +
    `&sort[0][column]=period` +
    `&sort[0][direction]=desc` +
    `&length=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  const entry = json?.response?.data?.[0]
  return entry?.value ? { price: parseFloat(entry.value), period: entry.period } : null
}

// county is optional — if provided and in a known metro, fetches metro-level price
export async function fetchStateGasPrice(stateName, county = null) {
  if (!EIA_KEY) return null
  const area = STATE_AREA[stateName]
  if (!area) return null

  const metroArea = county
    ? (COUNTY_METRO[`${normalizeCounty(county)}|${stateName}`] ?? null)
    : null

  try {
    // 1. Try metro area (when county maps to one)
    if (metroArea) {
      const cached = getCached(`eia_${metroArea}`)
      if (cached) return cached
      const r = await fetchArea(metroArea)
      if (r) {
        const result = { ...r, label: METRO_LABELS[metroArea] }
        setCached(`eia_${metroArea}`, result)
        return result
      }
    }

    // 2. Try state-level
    const cached = getCached(`eia_${area}`)
    if (cached) return cached
    const r = await fetchArea(area)
    if (r) { setCached(`eia_${area}`, r); return r }

    // 3. PADD sub-region fallback
    const paddArea = PADD_FALLBACK[area]
    if (paddArea) {
      const cached = getCached(`eia_${paddArea}`)
      if (cached) return cached
      const r = await fetchArea(paddArea)
      if (r) { setCached(`eia_${paddArea}`, r); return r }
    }

    return null
  } catch {
    return null
  }
}
