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

export async function fetchStateGasPrice(stateName) {
  if (!EIA_KEY) return null
  const area = STATE_AREA[stateName]
  if (!area) return null

  try {
    const params = new URLSearchParams({
      api_key: EIA_KEY,
      frequency: 'weekly',
      length: '1',
    })
    params.append('data[]', 'value')
    params.append('facets[product][]', 'EPM0')
    params.append('facets[duoarea][]', area)
    params.append('sort[0][column]', 'period')
    params.append('sort[0][direction]', 'desc')

    const res = await fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data/?${params}`)
    if (!res.ok) return null
    const json = await res.json()
    const val = json?.response?.data?.[0]?.value
    return val ? parseFloat(val) : null
  } catch {
    return null
  }
}
