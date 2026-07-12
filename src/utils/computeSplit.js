// computeSplit.js — pure function: given a trip's total cost and how it
// should be divided, returns what the driver and each passenger owe.
// No React, no DOM, no fetch — safe to unit test directly.

// passengers === 0 means a solo trip (nobody to split with): the driver
// owes the full total and splitMode doesn't apply.
export function computeSplit({ totalCost, passengers, splitMode, customShares }) {
  if (passengers === 0) {
    return { perPerson: totalCost }
  }

  if (splitMode === 'custom' && customShares?.length > 0) {
    const shares        = customShares.slice(0, passengers).map(s => parseFloat(s) || 0)
    const totalSharePct = shares.reduce((a, b) => a + b, 0)
    const customAmounts = shares.map(s => totalCost * (s / 100))
    const driverPct     = Math.max(0, 100 - totalSharePct)
    const driverAmount  = totalCost * (driverPct / 100)
    // perPerson is a fallback headline number for callers that don't need the
    // per-passenger breakdown (e.g. trip summaries). It is NOT what every
    // passenger owes — each passenger's real share is customAmounts[i].
    return { perPerson: customAmounts[0] ?? 0, customAmounts, driverPct, driverAmount, totalSharePct }
  }

  const perPerson = splitMode === 'even'
    ? totalCost / (passengers + 1)  // driver + passengers all pay equally
    : totalCost / passengers        // passengers cover the driver entirely
  return { perPerson }
}
