const STATE_FIPS = {
  Alabama: '01', Alaska: '02', Arizona: '04', Arkansas: '05',
  California: '06', Colorado: '08', Connecticut: '09', Delaware: '10',
  'District of Columbia': '11', Florida: '12', Georgia: '13',
  Hawaii: '15', Idaho: '16', Illinois: '17', Indiana: '18',
  Iowa: '19', Kansas: '20', Kentucky: '21', Louisiana: '22',
  Maine: '23', Maryland: '24', Massachusetts: '25', Michigan: '26',
  Minnesota: '27', Mississippi: '28', Missouri: '29', Montana: '30',
  Nebraska: '31', Nevada: '32', 'New Hampshire': '33', 'New Jersey': '34',
  'New Mexico': '35', 'New York': '36', 'North Carolina': '37',
  'North Dakota': '38', Ohio: '39', Oklahoma: '40', Oregon: '41',
  Pennsylvania: '42', 'Rhode Island': '44', 'South Carolina': '45',
  'South Dakota': '46', Tennessee: '47', Texas: '48', Utah: '49',
  Vermont: '50', Virginia: '51', Washington: '53', 'West Virginia': '54',
  Wisconsin: '55', Wyoming: '56',
}

export async function fetchCounties(stateName) {
  const fips = STATE_FIPS[stateName]
  if (!fips) return []
  try {
    const url = `https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*&in=state:${fips}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    // Row 0 is header ["NAME","state","county"]; rest are ["County Name, State", fips, county_fips]
    return data.slice(1)
      .map(row => row[0].split(', ')[0])   // "Autauga County" from "Autauga County, Alabama"
      .sort()
  } catch {
    return []
  }
}
