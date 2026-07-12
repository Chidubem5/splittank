import { describe, it, expect } from 'vitest'
import { mostCommonTrimIdx } from './trimPopularity'

describe('mostCommonTrimIdx', () => {
  it('returns 0 for a single option', () => {
    expect(mostCommonTrimIdx([{ text: '2.0L Turbo AWD' }])).toBe(0)
  })

  it('prefers the 4-cylinder base trim over V6/AWD variants', () => {
    const opts = [
      { text: '3.5L V6 AWD' },
      { text: '2.5L 4-Cyl FWD' },
      { text: '3.5L V6 4WD Sport' },
    ]
    expect(mostCommonTrimIdx(opts)).toBe(1)
  })

  it('penalizes hybrid/electric/manual variants relative to the standard trim', () => {
    const opts = [
      { text: '2.0L 4-Cyl Automatic' },
      { text: '2.0L 4-Cyl Hybrid' },
      { text: '2.0L 4-Cyl Manual' },
    ]
    expect(mostCommonTrimIdx(opts)).toBe(0)
  })
})
