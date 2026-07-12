// sms.js — cross-platform `sms:` deep link builder.
//
// iOS's Messages handler diverges from the URI spec: it only pre-fills the
// message body when the body is joined with `&`, not `?` — a quirk that's
// persisted across iOS versions. Android (and everything else) expects the
// standard `?body=` query string. Get this wrong and the Messages app opens
// with an empty draft instead of the pre-filled payment request.
export function buildSmsUrl(phone, body, userAgent = navigator.userAgent) {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const separator = isIOS ? '&' : '?'
  return `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(body)}`
}
