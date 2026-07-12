import { describe, it, expect } from 'vitest'
import { computeSplit } from './computeSplit'

describe('computeSplit', () => {
  it('splits evenly including the driver', () => {
    const { perPerson } = computeSplit({ totalCost: 40, passengers: 3, splitMode: 'even' })
    expect(perPerson).toBeCloseTo(10) // 40 / (3 passengers + 1 driver)
  })

  it('has passengers cover the driver entirely', () => {
    const { perPerson } = computeSplit({ totalCost: 30, passengers: 3, splitMode: 'cover' })
    expect(perPerson).toBeCloseTo(10) // 30 / 3 passengers
  })

  it('solo trip (0 passengers) charges the full cost regardless of splitMode', () => {
    expect(computeSplit({ totalCost: 55, passengers: 0, splitMode: 'even' }).perPerson).toBe(55)
    expect(computeSplit({ totalCost: 55, passengers: 0, splitMode: 'cover' }).perPerson).toBe(55)
    expect(computeSplit({ totalCost: 55, passengers: 0, splitMode: 'custom' }).perPerson).toBe(55)
  })

  it('gives each passenger their own custom-split amount, not passenger 0\'s', () => {
    // Regression test: sendPaymentRequest() used to charge every passenger
    // customAmounts[0] because it read result.perPerson for everyone.
    const { customAmounts } = computeSplit({
      totalCost: 100, passengers: 3, splitMode: 'custom', customShares: ['50', '30', '20'],
    })
    expect(customAmounts[0]).toBeCloseTo(50)
    expect(customAmounts[1]).toBeCloseTo(30)
    expect(customAmounts[2]).toBeCloseTo(20)
  })

  it('computes the driver\'s share as the remainder of 100%', () => {
    const { driverPct, driverAmount } = computeSplit({
      totalCost: 100, passengers: 2, splitMode: 'custom', customShares: ['30', '30'],
    })
    expect(driverPct).toBeCloseTo(40)
    expect(driverAmount).toBeCloseTo(40)
  })

  it('clamps driver share to 0 when custom shares exceed 100%', () => {
    const { driverPct } = computeSplit({
      totalCost: 100, passengers: 2, splitMode: 'custom', customShares: ['70', '60'],
    })
    expect(driverPct).toBe(0)
  })

  it('falls back to a plain per-passenger split when custom mode has no shares yet', () => {
    // customShares is briefly empty right after switching to custom mode,
    // before the UI's resize effect populates it — must not throw or return NaN.
    const { perPerson, customAmounts } = computeSplit({
      totalCost: 40, passengers: 3, splitMode: 'custom', customShares: [],
    })
    expect(customAmounts).toBeUndefined()
    expect(perPerson).toBeCloseTo(40 / 3)
  })
})
