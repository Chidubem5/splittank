const EIA_KEY = import.meta.env.VITE_EIA_API_KEY

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

// States not in the EIA weekly survey fall back to their PADD region
const PADD_FALLBACK = {
  SAK: 'R50', SHI: 'R50',           // Alaska + Hawaii → PADD 5
  SND: 'R20', SSD: 'R20',           // Dakotas → PADD 2
  SWY: 'R40', SMT: 'R40',           // WY + MT → PADD 4
}

async function fetchArea(area) {
  // Build URL manually — URLSearchParams percent-encodes brackets which breaks EIA v2
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
  const val = json?.response?.data?.[0]?.value
  return val ? parseFloat(val) : null
}

export async function fetchStateGasPrice(stateName) {
  if (!EIA_KEY) return null
  const area = STATE_AREA[stateName]
  if (!area) return null

  try {
    const price = await fetchArea(area)
    if (price) return price

    // Try PADD region fallback for states with sparse EIA data
    const paddArea = PADD_FALLBACK[area]
    if (paddArea) return await fetchArea(paddArea)

    return null
  } catch {
    return null
  }
}
