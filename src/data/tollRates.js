// Average cost per detected toll event (booth or gantry) by US state.
// Figures represent the typical charge for a standard 2-axle passenger vehicle
// at a single toll collection point — higher in states with big bridge/tunnel
// crossings or per-mile pricing, lower in states with flat-rate mainline plazas.
export const TOLL_RATE_BY_STATE = {
  // Northeast — highest rates, dense toll infrastructure
  'New York':           3.00,  // Thruway + bridges/tunnels (GWB, Verrazzano, etc.)
  'New Jersey':         2.00,  // NJ Turnpike, Garden State Parkway
  'Pennsylvania':       2.50,  // PA Turnpike (~$0.12/mile, long inter-plaza gaps)
  'Delaware':           2.50,  // DE Turnpike (I-95) ~$4-5 per crossing
  'Maryland':           2.00,  // I-95, Bay Bridge, Fort McHenry Tunnel
  'Connecticut':        1.50,  // New CTFastrak + Merritt Parkway gantries
  'Massachusetts':      1.75,  // Mass Pike (all-electronic exit-based tolling)
  'Rhode Island':       1.00,  // RI E-ZPass express lanes
  'New Hampshire':      1.00,  // NH Turnpike, Blue Star Turnpike
  'Maine':              1.50,  // Maine Turnpike

  // Mid-Atlantic / Southeast
  'Virginia':           1.75,  // I-66, I-495/95 Express, Dulles Toll Road
  'North Carolina':     1.00,  // NC Turnpike Authority
  'Florida':            1.00,  // FL Turnpike, SunPass gantries (~$0.10/mi)
  'Georgia':            0.75,  // I-85 Express, Peach Pass lanes

  // Midwest
  'Ohio':               0.75,  // Ohio Turnpike (~$0.045/mile, very dense gantries)
  'Indiana':            1.00,  // Indiana Toll Road
  'Illinois':           1.25,  // Illinois Tollway (I-PASS)
  'Kansas':             1.00,  // Kansas Turnpike / Kansas Pike
  'Oklahoma':           0.75,  // Oklahoma Turnpike Authority (cheap)
  'Texas':              1.25,  // Dallas/Houston toll networks, SH-130

  // Mountain / West
  'Colorado':           1.50,  // E-470, C-470, I-25 Express
  'California':         2.25,  // Bay Area bridges ($7), SR-91, I-680 express
  'Washington':         1.50,  // SR-520 floating bridge, Good to Go! lanes
  'Oregon':             1.00,  // I-205 Abernathy Bridge, upcoming Portland lanes
  'Utah':               1.00,  // Legacy Parkway, Mountain View Corridor

  // Default for lightly-tolled or unrecognized states
  '_default':           1.25,
}

export function getTollRate(stateName) {
  return TOLL_RATE_BY_STATE[stateName] ?? TOLL_RATE_BY_STATE['_default']
}
