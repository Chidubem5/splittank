// trimPopularity.js — scores a trim option string to estimate how commonly
// it sells in the US, so the trim picker can default to the volume trim.
// Higher score = more likely to be the volume trim. Ties go to the earlier index.
// Logic: 4-cyl outsells 6/8; FWD/RWD outsells AWD; automatics dominate;
// hybrids/EVs/performance variants are niche relative to base powertrain.
export function trimPopularityScore(text) {
  const t = text.toLowerCase()
  let s = 0
  if (/\b4-?cyl\b|\bi-?4\b/.test(t))              s += 4
  if (/\b3-?cyl\b|\bi-?3\b/.test(t))              s += 3
  if (/\b6-?cyl\b|\bv-?6\b/.test(t))              s -= 1
  if (/\b8-?cyl\b|\bv-?8\b/.test(t))              s -= 3
  if (/\b(10|12)-?cyl\b|\bv-?1[02]\b/.test(t))   s -= 5
  if (/\bawd\b|\b4wd\b|\b4x4\b|\ball.?wheel/.test(t)) s -= 2
  if (/\bmanual\b|\bm\/t\b/.test(t))              s -= 2
  if (/\bphev\b|\bplug.?in\b/.test(t))            s -= 1
  if (/\bhybrid\b/.test(t))                       s -= 1
  if (/\belectric\b|\bbev\b/.test(t))             s -= 2
  return s
}

export function mostCommonTrimIdx(opts) {
  if (opts.length <= 1) return 0
  let bestIdx = 0, bestScore = trimPopularityScore(opts[0].text)
  for (let i = 1; i < opts.length; i++) {
    const s = trimPopularityScore(opts[i].text)
    if (s > bestScore) { bestScore = s; bestIdx = i }
  }
  return bestIdx
}
