// stateLookup.js — point-in-state lookup, done entirely client-side.
//
// Reuses the same US states topology GasPriceMap.jsx already renders (fetched
// once and cached by the CDN, not bundled). detectRouteStates() used to
// reverse-geocode every sampled route point against Nominatim, which only
// allows 1 request/sec — firing up to 14 of them in parallel risked silent
// rate-limit failures. Point-in-polygon against a topology we already have
// is instant and makes zero network requests after the first load.

import { feature } from 'topojson-client'
import { geoContains } from 'd3-geo'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

let statesPromise = null

function loadStateFeatures() {
  if (!statesPromise) {
    statesPromise = fetch(GEO_URL)
      .then(r => r.json())
      .then(topology => feature(topology, topology.objects.states).features)
  }
  return statesPromise
}

// Resolves the state name (matching STATE_GAS_PRICES keys) containing each
// [lon, lat] point, or null for points outside every state polygon.
// Loads the topology once and reuses it for every point in the batch.
export async function getStatesAtPoints(points) {
  const states = await loadStateFeatures()
  return points.map(([lon, lat]) => {
    const hit = states.find(f => geoContains(f, [lon, lat]))
    return hit?.properties?.name ?? null
  })
}
