// contact.js — routes a passenger payment request to email or SMS depending
// on what the driver typed, matching the "phone or email" pattern the Zelle
// field already uses elsewhere in this app.
export function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())
}

export function buildMailtoUrl(email, subject, body) {
  return `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
