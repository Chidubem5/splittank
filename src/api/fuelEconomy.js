const BASE = 'https://www.fueleconomy.gov/ws/rest';
const HEADERS = { Accept: 'application/json' };

function toArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export async function getYears() {
  const res = await fetch(`${BASE}/vehicle/menu/year`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch years');
  const data = await res.json();
  return toArray(data.menuItem)
    .map(i => i.value)
    .sort((a, b) => Number(b) - Number(a));
}

export async function getMakes(year) {
  const res = await fetch(`${BASE}/vehicle/menu/make?year=${year}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch makes');
  const data = await res.json();
  return toArray(data.menuItem).map(i => i.value).sort();
}

export async function getModels(year, make) {
  const res = await fetch(
    `${BASE}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return toArray(data.menuItem).map(i => i.value).sort();
}

export async function getOptions(year, make, model) {
  const res = await fetch(
    `${BASE}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error('Failed to fetch options');
  const data = await res.json();
  return toArray(data.menuItem).map(i => ({ value: i.value, text: i.text }));
}

export async function getVehicleMPG(id) {
  const res = await fetch(`${BASE}/vehicle/${id}`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to fetch vehicle');
  const data = await res.json();
  return {
    city: Number(data.city08) || null,
    highway: Number(data.highway08) || null,
    combined: Number(data.comb08) || null,
  };
}
