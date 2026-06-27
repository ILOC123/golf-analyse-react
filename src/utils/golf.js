export function calcPlayingHcp(hcp, cr, sr, coursePar) {
  return Math.round(hcp * (sr / 113) + (cr - coursePar))
}

export function extraStrokes(playingHcp, si) {
  let n = 0
  if (si > 0 && si <= playingHcp) n++
  if (si > 0 && si <= playingHcp - 18) n++
  return n
}

export function calcRoundStableford(round, courses) {
  const course = courses[round.courseId]
  const pHcp = round.playingHcp || 0
  let pts = 0
  round.holes.forEach((h, i) => {
    if (!h || !h.score) return
    const par = course?.holes[i]?.par ?? 4
    const si  = course?.holes[i]?.si  ?? 0
    const ex  = extraStrokes(pHcp, si)
    const d   = (h.score - ex) - par
    pts += d <= -2 ? 4 : d === -1 ? 3 : d === 0 ? 2 : d === 1 ? 1 : 0
  })
  return pts
}

export function formatDate(dateStr) {
  return dateStr.split('-').reverse().join('.')
}

export function diffSign(diff) {
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

export function diffClass(diff) {
  if (diff > 0) return 'clr-pos'
  if (diff < 0) return 'clr-neg'
  return 'clr-neu'
}

export function scoreBadgeClass(diff) {
  if (diff <= -2) return 'eagle'
  if (diff === -1) return 'birdie'
  if (diff === 0)  return ''
  if (diff === 1)  return 'bogey'
  if (diff === 2)  return 'doppel'
  return 'triple'
}
