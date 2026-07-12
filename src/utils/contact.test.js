import { describe, it, expect } from 'vitest'
import { isEmail, buildMailtoUrl } from './contact'

describe('isEmail', () => {
  it('recognizes a plain email address', () => {
    expect(isEmail('friend@example.com')).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isEmail('  friend@example.com  ')).toBe(true)
  })

  it('rejects phone numbers', () => {
    expect(isEmail('5551234567')).toBe(false)
    expect(isEmail('+1 (555) 123-4567')).toBe(false)
  })

  it('rejects an email missing a domain suffix', () => {
    expect(isEmail('friend@example')).toBe(false)
  })

  it('rejects empty input', () => {
    expect(isEmail('')).toBe(false)
  })
})

describe('buildMailtoUrl', () => {
  it('encodes the subject and body but not the address', () => {
    const url = buildMailtoUrl('friend@example.com', 'Your gas share: $12.50', 'Pay $12.50 — thanks!')
    expect(url).toBe(
      'mailto:friend@example.com?subject=' + encodeURIComponent('Your gas share: $12.50') +
      '&body=' + encodeURIComponent('Pay $12.50 — thanks!')
    )
  })

  it('trims whitespace from the address', () => {
    const url = buildMailtoUrl('  friend@example.com  ', 'Hi', 'Body')
    expect(url.startsWith('mailto:friend@example.com?')).toBe(true)
  })
})
