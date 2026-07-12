import { describe, it, expect } from 'vitest'
import { normalizeCounty } from './gasPrice'

describe('normalizeCounty', () => {
  it('strips the "County" suffix and lowercases', () => {
    expect(normalizeCounty('Harris County')).toBe('harris')
  })

  it('strips Louisiana-style "Parish" and Alaska-style "Borough"/"Census Area"', () => {
    expect(normalizeCounty('Orleans Parish')).toBe('orleans')
    expect(normalizeCounty('Juneau Borough')).toBe('juneau')
    expect(normalizeCounty('Nome Census Area')).toBe('nome')
  })

  it('strips "Municipality" (used in a handful of states)', () => {
    expect(normalizeCounty('Anchorage Municipality')).toBe('anchorage')
  })

  it('leaves names without a recognized suffix untouched aside from casing', () => {
    expect(normalizeCounty('Miami-Dade')).toBe('miami-dade')
  })
})
