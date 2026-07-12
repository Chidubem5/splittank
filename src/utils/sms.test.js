import { describe, it, expect } from 'vitest'
import { buildSmsUrl } from './sms'

const IOS_UA     = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'

describe('buildSmsUrl', () => {
  it('uses & before body on iOS — ?body= silently drops the pre-filled text there', () => {
    const url = buildSmsUrl('5551234567', 'hello', IOS_UA)
    expect(url).toBe('sms:5551234567&body=hello')
  })

  it('uses ?body= on Android and everything else', () => {
    const url = buildSmsUrl('5551234567', 'hello', ANDROID_UA)
    expect(url).toBe('sms:5551234567?body=hello')
  })

  it('encodes both the phone number and the message body', () => {
    const url = buildSmsUrl('+1 (555) 123-4567', 'Pay $12.50 — thanks!', ANDROID_UA)
    expect(url).toContain(encodeURIComponent('+1 (555) 123-4567'))
    expect(url).toContain(encodeURIComponent('Pay $12.50 — thanks!'))
  })
})
