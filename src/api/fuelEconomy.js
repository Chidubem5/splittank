// fuelEconomy.js
// Fetches vehicle data from the U.S. Dept. of Energy's FuelEconomy.gov REST API.
// The API works as a cascade of dependent calls:
//   1. getYears()         → list of model years (e.g. 2024, 2023, ...)
//   2. getMakes(year)     → list of makes for that year (e.g. Toyota, Ford)
//   3. getModels(y, make) → list of models (e.g. RAV4, Camry)
//   4. getOptions(...)    → list of trim/engine variants for that model
//   5. getVehicleMPG(id)  → city/highway/combined MPG for one specific trim
//
// Each step depends on the result of the previous one, which is why the
// UI dropdowns are enabled one at a time as the user makes selections.

// Base URL for all API requests
const BASE = 'https://www.fueleconomy.gov/ws/rest';

// Tell the API we want JSON back (it can also return XML)
const HEADERS = { Accept: 'application/json' };

// ─────────────────────────────────────────
// toArray — defensive helper
// The API sometimes returns a single object instead of an array when there's
// only one result. This normalizes both cases to always be an array.
// Example: { menuItem: {value:"2024"} } → [{value:"2024"}]
//          { menuItem: [{...},{...}]   } → [{...},{...}]
// ─────────────────────────────────────────
function toArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

// Fetch all model years, sorted newest first (descending).
// async/await: "await" pauses execution until the fetch resolves,
// then continues with the result. Errors bubble up to the caller.
export async function getYears() {
  const res = await fetch(`${BASE}/vehicle/menu/year`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch years');
  const data = await res.json();
  return toArray(data.menuItem)
    .map(i => i.value)                        // extract just the year string
    .sort((a, b) => Number(b) - Number(a));   // sort descending: 2025, 2024, ...
}

// Fetch all makes (brands) for a given year, sorted A-Z.
export async function getMakes(year) {
  const res = await fetch(`${BASE}/vehicle/menu/make?year=${year}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch makes');
  const data = await res.json();
  return toArray(data.menuItem).map(i => i.value).sort();
}

// Fetch all models for a given year + make.
// encodeURIComponent() escapes special chars so "General Motors" becomes
// "General%20Motors" — safe to put in a URL.
export async function getModels(year, make) {
  const res = await fetch(
    `${BASE}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return toArray(data.menuItem).map(i => i.value).sort();
}

// Fetch trim/engine options for a specific model.
// Returns objects with { value, text } — value is the numeric vehicle ID used
// to fetch MPG, text is the human-readable label shown in the dropdown.
export async function getOptions(year, make, model) {
  const res = await fetch(
    `${BASE}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error('Failed to fetch options');
  const data = await res.json();
  return toArray(data.menuItem).map(i => ({ value: i.value, text: i.text }));
}

// Fetch MPG figures for a specific vehicle ID.
// The API returns many fields; we only need city08, highway08, comb08
// (the "08" suffix means the current EPA test cycle, introduced in 2008).
// Number() converts strings like "28" to the number 28.
// "|| null" turns 0 (which means "no data") into null so the UI knows to hide it.
// Typical tank sizes (gallons) by EPA vehicle class.
// Used as a fallback when the user hasn't entered their tank size manually.
const TANK_BY_CLASS = {
  'Minicompact Cars':            10,
  'Subcompact Cars':             12,
  'Compact Cars':                13,
  'Midsize Cars':                15,
  'Large Cars':                  17,
  'Small Station Wagons':        14,
  'Midsize Station Wagons':      16,
  'Small Pickup Trucks 2WD':     18,
  'Small Pickup Trucks 4WD':     18,
  'Standard Pickup Trucks 2WD':  22,
  'Standard Pickup Trucks 4WD':  22,
  'Small SUV 2WD':               15,
  'Small SUV 4WD':               15,
  'Standard SUV 2WD':            20,
  'Standard SUV 4WD':            20,
  'Minivan - 2WD':               20,
  'Minivan - 4WD':               20,
  'Cargo Vans':                  25,
  'Passenger Vans':              25,
}

export function estimateTankSize(vclass) {
  if (!vclass) return null
  // Exact match first, then partial match for edge cases
  if (TANK_BY_CLASS[vclass]) return TANK_BY_CLASS[vclass]
  const key = Object.keys(TANK_BY_CLASS).find(k => vclass.toLowerCase().includes(k.toLowerCase().split(' ')[0]))
  return key ? TANK_BY_CLASS[key] : 15  // 15 gal default if class is unrecognised
}

export async function getVehicleMPG(id) {
  const res = await fetch(`${BASE}/vehicle/${id}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch vehicle');
  const data = await res.json();

  const isEV   = data.atvType === 'EV'
  const isPhev = data.atvType === 'PHEV' || data.atvType === 'Plug-in Hybrid'

  // kWh/100mi → mi/kWh conversion for EV efficiency fields
  const toMiPerKwh = v => {
    const n = Number(v)
    return n > 0 ? parseFloat((100 / n).toFixed(2)) : null
  }

  return {
    // Gas / MPGe figures (city08/highway08 are MPGe for EVs)
    city:     Number(data.city08)    || null,
    highway:  Number(data.highway08) || null,
    combined: Number(data.comb08)    || null,
    vclass:   data.VClass            || null,
    isEV,
    isPhev,
    // EV-specific: mi/kWh converted from EPA kWh/100mi
    cityMiPerKwh:    isEV ? toMiPerKwh(data.cityE)    : null,
    highwayMiPerKwh: isEV ? toMiPerKwh(data.highwayE) : null,
    combMiPerKwh:    isEV ? toMiPerKwh(data.combE)    : null,
    epaRange:        isEV ? (Number(data.range) || null) : null,
  };
}
