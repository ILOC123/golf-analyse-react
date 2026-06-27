import { useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import ScoreBadge from '../components/ScoreBadge'
import { calcPlayingHcp, extraStrokes, diffSign } from '../utils/golf'
import styles from './Runde.module.css'

function scoreClass(diff) {
  if (diff <= -2) return styles.eagle
  if (diff === -1) return styles.birdie
  if (diff === 1)  return styles.bogey
  if (diff === 2)  return styles.doppel
  if (diff >= 3)   return styles.triple
  return ''
}

function calcSummaryStrip(round, course, pHcp) {
  let outScore = 0, outPts = 0, outVis = 0
  let inScore  = 0, inPts  = 0, inVis  = 0
  let visScore = 0, visPar = 0, strokesRec = 0

  round.holes.forEach((h, i) => {
    const par = course?.holes[i]?.par ?? 4
    const si  = course?.holes[i]?.si  ?? 0
    const ex  = extraStrokes(pHcp, si)
    const sc  = h.score || par

    if (i < 9) {
      if (round.visited[i]) {
        outScore += sc; outVis++
        const d = (sc - ex) - par
        outPts += d <= -2 ? 4 : d === -1 ? 3 : d === 0 ? 2 : d === 1 ? 1 : 0
      }
    } else {
      if (round.visited[i]) {
        inScore += sc; inVis++
        const d = (sc - ex) - par
        inPts += d <= -2 ? 4 : d === -1 ? 3 : d === 0 ? 2 : d === 1 ? 1 : 0
      }
    }

    if (round.visited[i]) {
      visScore += sc; visPar += par; strokesRec += ex
    }
  })

  return {
    totScore:   outScore + inScore,
    nettoDiff:  (visScore - visPar) - strokesRec,
    outPts:     outVis ? outPts : null,
    inPts:      inVis  ? inPts  : null,
  }
}

export default function Runde({ data, onRoundSaved }) {
  const { courses, latestHcp, saveRoundComplete } = data
  const courseIds = Object.keys(courses)

  const [form, setForm] = useState({
    courseId: '',
    tee: '',
    date: new Date().toISOString().slice(0, 10),
    hcp: '',
  })
  const [round, setRound]               = useState(null)
  const [activeHole, setActiveHole]     = useState(0)
  const [showOverview, setShowOverview] = useState(false)

  // Resolve form defaults
  const courseId = form.courseId || courseIds[0] || ''
  const course   = courses[courseId]
  const tees     = course?.tees || []
  const tee      = form.tee || tees[0]?.name || ''
  const hcp      = form.hcp !== '' ? form.hcp : String(latestHcp() ?? '')

  function handleCourseChange(id) {
    setForm((f) => ({ ...f, courseId: id, tee: '' }))
  }

  function startRound() {
    if (!courseId || !course || !form.date) return
    const coursePar = course.holes.reduce((s, h) => s + (h.par || 4), 0)
    const teeData   = tees.find((t) => t.name === tee)
    const cr        = teeData?.cr ?? 72
    const sr        = teeData?.sr ?? 113
    const pHcp      = calcPlayingHcp(parseFloat(hcp) || 0, cr, sr, coursePar)

    setRound({
      id: 'r_' + Date.now(),
      courseId,
      tee,
      date:       form.date,
      handicap:   parseFloat(hcp) || 0,
      playingHcp: pHcp,
      holes: Array.from({ length: 18 }, (_, i) => ({
        score:   course.holes[i]?.par ?? 4,
        fairway: null,
        gir:     false,
        putts:   0,
        ob:      0,
      })),
      visited: Array.from({ length: 18 }, (_, i) => i === 0),
      note: '',
    })
    setActiveHole(0)
  }

  function goToHole(i) {
    setActiveHole(i)
    setRound((prev) => {
      if (prev.visited[i]) return prev
      const visited = [...prev.visited]
      visited[i] = true
      return { ...prev, visited }
    })
  }

  function changeVal(field, delta) {
    setRound((prev) => ({
      ...prev,
      holes: prev.holes.map((h, i) => {
        if (i !== activeHole) return h
        if (field === 'score') return { ...h, score: Math.max(1, (h.score || 0) + delta) }
        if (field === 'putts') return { ...h, putts: Math.max(0, (h.putts || 0) + delta) }
        if (field === 'ob')    return { ...h, ob:    Math.max(0, (h.ob    || 0) + delta) }
        return h
      }),
    }))
  }

  function setFw(val) {
    setRound((prev) => ({
      ...prev,
      holes: prev.holes.map((h, i) =>
        i === activeHole ? { ...h, fairway: h.fairway === val ? null : val } : h
      ),
    }))
  }

  function setGir(val) {
    setRound((prev) => ({
      ...prev,
      holes: prev.holes.map((h, i) => i === activeHole ? { ...h, gir: val } : h),
    }))
  }

  function handleSave() {
    if (!round || round.visited.filter(Boolean).length < 18) return
    saveRoundComplete(round)
    setRound(null)
    onRoundSaved?.()
  }

  // ── Setup-Formular ─────────────────────────────────────────────
  if (!round) {
    return (
      <div className={styles.setup}>
        {courseIds.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--grey)', fontSize: 14 }}>
            Erst einen Kurs anlegen
          </div>
        ) : (
          <>
            <div className={styles.setupGrid}>
              <div>
                <label className="form-label" style={{ fontSize: 9 }}>GOLFPLATZ</label>
                <select
                  className="form-input"
                  style={{ padding: '7px 6px', fontSize: 14, height: 36, textAlign: 'center' }}
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  {courseIds.map((id) => (
                    <option key={id} value={id}>{courses[id].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 9 }}>ABSCHLAG</label>
                <select
                  className="form-input"
                  style={{ padding: '7px 6px', fontSize: 14, height: 36, textAlign: 'center' }}
                  value={tee}
                  onChange={(e) => setForm((f) => ({ ...f, tee: e.target.value }))}
                >
                  {tees.length === 0
                    ? <option value="">Kein Abschlag</option>
                    : tees.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} (CR {t.cr} / SR {t.sr})
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
            <div className={styles.setupGrid}>
              <div>
                <label className="form-label" style={{ fontSize: 9 }}>DATUM</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '7px 6px', height: 36 }}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 9 }}>HANDICAP</label>
                <input
                  type="number"
                  className="form-input"
                  min="0" max="54" step="0.1"
                  inputMode="decimal"
                  style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: 14, fontWeight: 700, padding: '7px 6px', height: 36 }}
                  value={hcp}
                  onChange={(e) => setForm((f) => ({ ...f, hcp: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={startRound}>
              Runde starten
            </button>
          </>
        )}
      </div>
    )
  }

  // ── Aktive Runde ───────────────────────────────────────────────
  const activeCourse = courses[round.courseId]
  const hDef   = activeCourse?.holes[activeHole]
  const par    = hDef?.par ?? 4
  const si     = hDef?.si  ?? 0
  const h      = round.holes[activeHole]
  const pHcp   = round.playingHcp || 0
  const extras = extraStrokes(pHcp, si)
  const diff   = (h.score || par) - par
  const cls    = scoreClass(diff)
  const visCount = round.visited.filter(Boolean).length
  const strip    = calcSummaryStrip(round, activeCourse, pHcp)

  const totBrutto = round.holes.reduce((s, hole, i) =>
    round.visited[i] ? s + (hole.score || 0) : s, 0
  )
  const totParVis = round.holes.reduce((s, _, i) =>
    round.visited[i] ? s + (activeCourse?.holes[i]?.par ?? 4) : s, 0
  )
  const totDiff = totBrutto - totParVis

  return (
    <div>
      {/* Fortschritt */}
      <div className={styles.progressWrap}>
        <div className={styles.progMeta}>
          <span>Loch {activeHole + 1} von 18</span>
          <span>{visCount} / 18</span>
        </div>
        <div className={styles.progBg}>
          <div className={styles.progFill} style={{ width: `${visCount / 18 * 100}%` }} />
        </div>
      </div>

      {/* Sticky header */}
      <div className={styles.stickyHeader}>
        <div className={styles.holeNav}>
          <button
            className={styles.hnb}
            onClick={() => goToHole(activeHole - 1)}
            disabled={activeHole === 0}
          >‹</button>
          <div className={styles.holeInfo}>
            <div className={styles.holeNumBig}>Loch {activeHole + 1}</div>
            <div className={styles.holeParInfo}>Par {par} · SI {si}</div>
          </div>
          <button
            className={styles.hnb}
            onClick={() => goToHole(activeHole + 1)}
            disabled={activeHole === 17}
          >›</button>
        </div>

        {/* Laufende Zusammenfassung */}
        <div className={styles.summaryStrip}>
          <div className={styles.sumLeft}>
            <span className={styles.sumTotal}>{totBrutto || '—'}</span>
            {totBrutto > 0 && (
              <span
                className={styles.sumDiff}
                style={{ color: totDiff > 0 ? 'var(--red)' : totDiff < 0 ? 'var(--green)' : 'var(--grey)' }}
              >
                {diffSign(totDiff)}
              </span>
            )}
          </div>
          <div className={styles.sumRight}>
            <div className={styles.sumNetto}>
              Netto: <b style={{
                color: strip.nettoDiff > 0 ? 'var(--red)' : strip.nettoDiff < 0 ? 'var(--green)' : 'var(--grey)',
              }}>
                {totBrutto ? diffSign(strip.nettoDiff) : '—'}
              </b>
            </div>
            <div className={styles.sumPts}>
              <span>Front: <b>{strip.outPts !== null ? strip.outPts : '—'}</b></span>
              <span>Back: <b>{strip.inPts !== null ? strip.inPts : '—'}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Spielvorgabe */}
      <div className={styles.hcpInfo}>
        <span style={{ fontSize: 11, color: 'var(--grey)' }}>
          Spielvorgabe: <strong style={{ color: 'var(--white)' }}>{pHcp}</strong>
        </span>
        {extras > 0 && (
          <span className={styles.extraBadge}>
            +{extras} {extras === 1 ? 'Schlag' : 'Schläge'}
          </span>
        )}
      </div>

      {/* Eingabe-Karte */}
      <div className={styles.entryCard}>
        <div className={styles.entryRow}>
          <div className={styles.entryLabel}>Score</div>
          <div className={styles.scw}>
            <button className={styles.scbtn} onClick={() => changeVal('score', -1)}>−</button>
            <div className={`${styles.scVal} ${cls}`}>{h.score || par}</div>
            <button className={styles.scbtn} onClick={() => changeVal('score', 1)}>+</button>
          </div>
        </div>

        {par > 3 && (
          <div className={styles.entryRow}>
            <div className={styles.entryLabel}>Fairway</div>
            <div className={styles.togglePill}>
              <button className={`${styles.topt} ${h.fairway === 'L' ? styles.toptOn : ''}`} onClick={() => setFw('L')}>◄ Links</button>
              <button className={`${styles.topt} ${h.fairway === 'H' ? styles.toptOn : ''}`} onClick={() => setFw('H')}>Getroffen</button>
              <button className={`${styles.topt} ${h.fairway === 'R' ? styles.toptOn : ''}`} onClick={() => setFw('R')}>Rechts ►</button>
            </div>
          </div>
        )}

        <div className={styles.entryRow}>
          <div className={styles.entryLabel}>Grün (GiR)</div>
          <div className={styles.togglePill}>
            <button className={`${styles.topt} ${!h.gir ? styles.toptOn : ''}`} onClick={() => setGir(false)}>Nein</button>
            <button className={`${styles.topt} ${h.gir  ? styles.toptOn : ''}`} onClick={() => setGir(true)}>Ja</button>
          </div>
        </div>

        <div className={styles.entryRow}>
          <div className={styles.entryLabel}>Putts</div>
          <div className={styles.scw}>
            <button className={styles.scbtn} onClick={() => changeVal('putts', -1)}>−</button>
            <div className={styles.scVal}>{h.putts}</div>
            <button className={styles.scbtn} onClick={() => changeVal('putts', 1)}>+</button>
          </div>
        </div>

        <div className={styles.entryRow}>
          <div className={styles.entryLabel}>OB</div>
          <div className={styles.scw}>
            <button className={styles.scbtn} onClick={() => changeVal('ob', -1)}>−</button>
            <div className={styles.scVal}>{h.ob}</div>
            <button className={styles.scbtn} onClick={() => changeVal('ob', 1)}>+</button>
          </div>
        </div>
      </div>

      {/* Live-Scorecard */}
      <div className={styles.liveOvr}>
        <LiveScorecard round={round} course={activeCourse} activeHole={activeHole} />
      </div>

      {/* Notiz */}
      <div style={{ padding: '0 12px 6px' }}>
        <textarea
          className="form-input"
          placeholder="Notiz zur Runde (optional)..."
          rows={2}
          style={{ resize: 'none', fontSize: 13, padding: '9px 10px' }}
          value={round.note || ''}
          onChange={(e) => setRound((prev) => ({ ...prev, note: e.target.value }))}
        />
      </div>

      {/* Aktions-Buttons */}
      <div style={{ padding: '0 12px 16px', display: 'flex', gap: 8 }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setRound(null)}>
          Abbrechen
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1, opacity: visCount < 18 ? 0.5 : 1 }}
          disabled={visCount < 18}
          onClick={handleSave}
        >
          Runde speichern
        </button>
      </div>

      {/* Übersicht-Sheet */}
      <BottomSheet
        isOpen={showOverview}
        onClose={() => setShowOverview(false)}
        title="Rundenübersicht"
      >
        <RoundOverview round={round} course={activeCourse} />
      </BottomSheet>
    </div>
  )
}

// ── Live-Scorecard ─────────────────────────────────────────────────
function LiveScorecard({ round, course, activeHole }) {
  function HalfTable({ start, end, label }) {
    const cells = []
    let totScore = 0, totPar = 0, anyVis = false

    for (let i = start; i < end; i++) {
      const par = course?.holes[i]?.par ?? 4
      const si  = course?.holes[i]?.si  ?? 0
      const ex  = extraStrokes(round.playingHcp || 0, si)
      const vis = round.visited[i]
      const sc  = round.holes[i]?.score || par
      totPar += par
      if (vis) { totScore += sc; anyVis = true }
      cells.push({ i, par, ex, vis, sc })
    }

    const totDiff = totScore - totPar

    return (
      <table className={styles.liveTable}>
        <tbody>
          <tr>
            {cells.map(({ i }) => (
              <td key={i} className={i === activeHole ? styles.liveActiveHole : ''}>
                <span style={{ fontSize: 9, color: i === activeHole ? 'var(--gold)' : 'var(--grey)', fontWeight: i === activeHole ? 700 : 400 }}>
                  {i + 1}
                </span>
              </td>
            ))}
            <td className={styles.liveSumCell}><span style={{ fontSize: 9 }}>{label}</span></td>
          </tr>
          <tr>
            {cells.map(({ i, par }) => (
              <td key={i}><span style={{ fontSize: 9, color: 'var(--grey-l)' }}>{par}</span></td>
            ))}
            <td className={styles.liveSumCell}><span style={{ fontSize: 9 }}>{totPar}</span></td>
          </tr>
          <tr>
            {cells.map(({ i, par, ex, vis, sc }) => (
              <td key={i}>
                {vis
                  ? <ScoreBadge score={sc} netPar={par + ex} size={9} />
                  : <span style={{ color: 'var(--grey)', fontSize: 9 }}>·</span>}
              </td>
            ))}
            <td className={styles.liveSumCell}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: anyVis
                  ? (totDiff > 0 ? 'var(--red)' : totDiff < 0 ? 'var(--green)' : 'var(--grey)')
                  : 'var(--grey)',
              }}>
                {anyVis ? diffSign(totDiff) : '—'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  return (
    <div className={styles.liveOvrInner}>
      <div className={styles.liveSectionLabel}>Scorecard</div>
      <HalfTable start={0} end={9}  label="Vor" />
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '3px 0' }} />
      <HalfTable start={9} end={18} label="Nach" />
    </div>
  )
}

// ── Rundenübersicht (BottomSheet) ───────────────────────────────────
function RoundOverview({ round, course }) {
  if (!round) return null

  const visited  = round.visited.filter(Boolean).length
  const totScore = round.holes.reduce((s, h, i) => round.visited[i] ? s + (h.score || 0) : s, 0)
  const totPar   = course ? course.holes.reduce((s, h) => s + (h.par || 4), 0) : 72
  const totDiff  = totScore - totPar

  function HalfTable({ start, end, label }) {
    const rows = []
    let totS = 0, totP = 0, anyVis = false

    for (let i = start; i < end; i++) {
      const par = course?.holes[i]?.par ?? 4
      const vis = round.visited[i]
      const sc  = round.holes[i]?.score || par
      totP += par
      if (vis) { totS += sc; anyVis = true }
      rows.push({ i, par, vis, sc, diff: sc - par })
    }

    const subDiff = totS - totP

    return (
      <div style={{ overflowX: 'auto', marginBottom: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 12 }}>
          <thead>
            <tr style={{ color: 'var(--grey)', fontSize: 9, textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <th style={{ textAlign: 'left', padding: 4, fontWeight: 400 }}></th>
              {rows.map(({ i }) => <th key={i} style={{ padding: '4px 3px', fontWeight: 400 }}>{i + 1}</th>)}
              <th style={{ background: 'var(--dark3)', padding: '4px 6px' }}>{label}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <td style={{ textAlign: 'left', fontSize: 10, color: 'var(--grey)', padding: '3px 4px' }}>Par</td>
              {rows.map(({ i, par }) => <td key={i} style={{ padding: '3px 2px' }}>{par}</td>)}
              <td style={{ background: 'var(--dark3)', fontWeight: 700, padding: '3px 6px' }}>{totP}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <td style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, padding: '3px 4px' }}>Score</td>
              {rows.map(({ i, par, vis, sc, diff }) => (
                <td key={i} style={{ padding: '3px 2px' }}>
                  {vis ? (
                    <span style={{
                      fontWeight: 700,
                      color: diff <= -2 ? '#D4A800'
                        : diff === -1 ? 'var(--green)'
                        : diff === 1  ? 'var(--orange)'
                        : diff >= 2   ? 'var(--red)'
                        : 'var(--white)',
                    }}>
                      {sc}
                    </span>
                  ) : <span style={{ color: 'var(--grey)' }}>—</span>}
                </td>
              ))}
              <td style={{ background: 'var(--dark3)', fontWeight: 700, padding: '3px 6px' }}>
                {anyVis ? totS : '—'}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, padding: '3px 4px' }}>+/−</td>
              {rows.map(({ i, vis, diff }) => (
                <td key={i} style={{ padding: '3px 2px', fontSize: 10, fontWeight: 700, color: diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--green)' : 'var(--grey)' }}>
                  {vis ? diffSign(diff) : <span style={{ color: 'var(--grey)' }}>—</span>}
                </td>
              ))}
              <td style={{
                background: 'var(--dark3)', fontWeight: 700, fontSize: 10, padding: '3px 6px',
                color: anyVis ? (subDiff > 0 ? 'var(--red)' : subDiff < 0 ? 'var(--green)' : 'var(--grey)') : 'var(--grey)',
              }}>
                {anyVis ? diffSign(subDiff) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0 14px', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 12 }}>
        <BigStat label="Score"    val={visited ? totScore : '—'} />
        <BigStat label="+/−"     val={visited ? diffSign(totDiff) : '—'} color={visited ? (totDiff > 0 ? 'var(--red)' : totDiff < 0 ? 'var(--green)' : 'var(--grey)') : undefined} />
        <BigStat label="Vorgabe" val={round.playingHcp ?? '—'} color="var(--gold)" />
        <BigStat label="Löcher"  val={`${visited}/18`} />
      </div>
      <HalfTable start={0}  end={9}  label="Vor" />
      <HalfTable start={9}  end={18} label="Nach" />
    </>
  )
}

function BigStat({ label, val, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 34, letterSpacing: 1, fontWeight: 800, color: color ?? 'var(--white)', lineHeight: 1 }}>
        {val}
      </div>
    </div>
  )
}
