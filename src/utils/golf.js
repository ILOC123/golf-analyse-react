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

export function diffLabel(d) {
  if (d <= -2) return 'eagle'
  if (d === -1) return 'birdie'
  if (d === 0)  return 'par'
  if (d === 1)  return 'bogey'
  if (d === 2)  return 'doppel'
  return 'triple'
}

export function calcStats(rounds, courses) {
  if (!rounds.length) return null
  let totalScore = 0
  const rCount = rounds.length
  let totalHoles = 0, fwHit = 0, fwTot = 0, girHit = 0, putts = 0, totalOB = 0
  let scrMiss = 0, scrSave = 0, onePutt = 0, threePlus = 0, puttHoles = 0
  let girPutts = 0, girPuttHoles = 0
  const dist = { eagle: 0, birdie: 0, par: 0, bogey: 0, doppel: 0, triple: 0 }
  const byPar = { 3: { s: 0, n: 0 }, 4: { s: 0, n: 0 }, 5: { s: 0, n: 0 } }
  const byHole = {}

  rounds.forEach(round => {
    const course = courses[round.courseId]
    let rs = 0
    round.holes.forEach((h, i) => {
      if (!h || !h.score) return
      const par = course?.holes[i]?.par ?? 4
      rs += h.score; totalHoles++
      if (h.fairway !== null && h.fairway !== undefined) { fwTot++; if (h.fairway === 'H' || h.fairway === true) fwHit++ }
      if (h.gir) girHit++
      const p = h.putts || 0; putts += p
      if (h.putts !== undefined && h.putts !== null) { puttHoles++; if (p === 1) onePutt++; if (p >= 3) threePlus++ }
      if (h.gir && h.putts != null) { girPuttHoles++; girPutts += p }
      totalOB += (h.ob || 0)
      if (h.gir === false) { scrMiss++; if (h.score <= par) scrSave++ }
      const lbl = diffLabel(h.score - par)
      dist[lbl] = (dist[lbl] || 0) + 1
      if (byPar[par]) { byPar[par].s += h.score; byPar[par].n++ }
      if (!byHole[i]) byHole[i] = { s: 0, n: 0, par }
      byHole[i].s += h.score; byHole[i].n++
    })
    totalScore += rs
  })

  const holeArr = Object.keys(byHole).map(i => {
    const h = byHole[i]
    return { hole: +i + 1, par: h.par, avg: h.s / h.n, diff: h.s / h.n - h.par, n: h.n }
  }).sort((a, b) => b.diff - a.diff)

  return {
    rCount,
    avgScore: (totalScore / rCount).toFixed(1),
    fwPct: fwTot ? Math.round(fwHit / fwTot * 100) : null,
    girPct: totalHoles ? Math.round(girHit / totalHoles * 100) : null,
    avgPutts: (putts / rCount).toFixed(1),
    avgOB: (totalOB / rCount).toFixed(1),
    scrPct: scrMiss ? Math.round(scrSave / scrMiss * 100) : null,
    onePuttPct: puttHoles ? Math.round(onePutt / puttHoles * 100) : null,
    threePlusPct: puttHoles ? Math.round(threePlus / puttHoles * 100) : null,
    puttPerGir: girPuttHoles ? (girPutts / girPuttHoles).toFixed(2) : null,
    bigMissPerRound: ((dist.doppel + (dist.triple || 0)) / rCount).toFixed(1),
    dist, byPar, holeArr,
    maxDist: Math.max(...Object.values(dist)),
  }
}

export function calcEstWhs(hcpLog) {
  const s = hcpLog.slice().sort((a, b) => b.date.localeCompare(a.date))
  const v = s.filter(e => e.asd !== null && e.asd !== undefined).slice(0, 20)
  if (v.length < 8) return null
  const best = v.slice().sort((a, b) => a.asd - b.asd).slice(0, 8)
  return Math.round(best.reduce((t, e) => t + e.asd, 0) / 8 * 0.96 * 10) / 10
}

export function getBest8Dates(hcpLog) {
  const s = hcpLog.slice().sort((a, b) => b.date.localeCompare(a.date))
  const v = s.filter(e => e.asd !== null && e.asd !== undefined).slice(0, 20)
  if (v.length < 8) return {}
  const set = {}
  v.slice().sort((a, b) => a.asd - b.asd).slice(0, 8).forEach(e => { set[e.date] = true })
  return set
}
