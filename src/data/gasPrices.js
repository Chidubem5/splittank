// gasPrices.js
// Static fallback gas prices ($/gallon, regular unleaded) used when:
//   a) The EIA API key is not configured, OR
//   b) The EIA API call fails for any reason (network error, rate limit, etc.)
//
// These prices are updated manually and represent state averages from
// EIA weekly data published in April 2026.
//
// States with higher prices (CA, HI, WA, OR, NV) are in the expensive
// West Coast and Pacific PADD 5 region. States with lower prices (TX, OK, MS)
// are in the cheaper Gulf Coast / Midwest regions.

export const STATE_GAS_PRICES = {
  Alabama:              3.84,
  Alaska:               5.50,
  Arizona:              4.60,
  Arkansas:             3.75,
  California:           5.84,
  Colorado:             3.83,
  Connecticut:          4.10,
  Delaware:             4.15,
  'District of Columbia': 4.20,
  Florida:              4.04,
  Georgia:              3.85,
  Hawaii:               5.90,
  Idaho:                3.95,
  Illinois:             4.20,
  Indiana:              3.85,
  Iowa:                 3.75,
  Kansas:               3.70,
  Kentucky:             3.80,
  Louisiana:            3.75,
  Maine:                4.05,
  Maryland:             4.25,
  Massachusetts:        4.07,
  Michigan:             4.05,
  Minnesota:            3.78,
  Mississippi:          3.70,
  Missouri:             3.75,
  Montana:              4.00,
  Nebraska:             3.80,
  Nevada:               4.80,
  'New Hampshire':      4.00,
  'New Jersey':         4.20,
  'New Mexico':         3.85,
  'New York':           4.18,
  'North Carolina':     3.85,
  'North Dakota':       3.90,
  Ohio:                 3.94,
  Oklahoma:             3.65,
  Oregon:               4.90,
  Pennsylvania:         4.25,
  'Rhode Island':       4.10,
  'South Carolina':     3.80,
  'South Dakota':       3.90,
  Tennessee:            3.75,
  Texas:                3.84,
  Utah:                 3.95,
  Vermont:              4.05,
  Virginia:             3.95,
  Washington:           5.32,
  'West Virginia':      3.90,
  Wisconsin:            3.80,
  Wyoming:              3.95,
};
