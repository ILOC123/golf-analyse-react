import { useState, Fragment } from 'react'
import BottomSheet from '../components/BottomSheet'
import ScoreBadge from '../components/ScoreBadge'
import {
  calcPlayingHcp, extraStrokes, calcRoundStableford,
  formatDate, diffSign, diffClass,
} from '../utils/golf'
import styles from './Verlauf.module.css'

export default function Verlauf({ data }) {
  const { rounds, courses, deleteRound, roundsSorted } = data
  const [detailId, setDetailId]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)

  const sorted = roundsSorted()
  const round  = detailId ? rounds.find(r => r.id === detailId) : null

  function openDetail(id) { setDetailId(id); setConfirmDel(false) }
  function closeDetail()  { setDetailId(null); setConfirmDel(false) }

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    deleteRound(detailId)
    closeDetail()
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Noch keine Runden</div>
          <div className="empty-sub">Erfasse deine erste Runde</div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 0 }}>
          {sorted.map(r => {
            const course = courses[r.courseId]
            const name   = course?.name ?? 'Unbekannter Platz'
            const score  = r.holes.reduce((s, h) => s + (h.score || 0), 0)
            const par    = course ? course.holes.reduce((s, h) => s + (h.par || 4), 0) : 72
            const diff   = score - par
            const pts    = calcRoundStableford(r, courses)
            return (
              <div key={r.id} className="list-row" onClick={() => openDetail(r.id)}>
                <div className="list-row-main">
                  <div className="list-row-title">{name}</div>
                  <div className="list-row-sub">{formatDate(r.date)} · {r.tee} · HCP {r.handicap}</div>
                  {r.note && <div className={styles.note}>{r.note}</div>}
                </div>
                <div className="list-row-right" style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div className={styles.listScore}>{score}</div>
                  <div className={diffClass(diff)}>{diffSign(diff)}</div>
                  <div className={styles.listPts}>{pts} Pkt</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BottomSheet
        isOpen={!!detailId}
        onClose={closeDetail}
        title={round ? (courses[round.courseId]?.name ?? 'Unbekannter Platz') : ''}
      >
        {round && <RoundDetail round={round} courses={courses} confirmDel={confirmDel} onDelete={handleDelete} />}
      </BottomSheet>
    </div>
  )
}

function RoundDetail({ round, courses, confirmDel, onDelete }) {
  const course   = courses[round.courseId]
  const coursePar = course ? course.holes.reduce((s, h) => s + h.par, 0) : 72
  const teeData  = course?.tees?.find(t => t.name === round.tee) ?? null
  const playHcp  = teeData ? calcPlayingHcp(round.handicap, teeData.cr, teeData.sr, coursePar) : null

  // Per-hole computed data
  const holeData = round.holes.map((h, i) => {
    const par    = course?.holes[i]?.par ?? 4
    const si     = course?.holes[i]?.si  ?? 0
    const extras = playHcp !== null ? extraStrokes(playHcp, si) : 0
    const sc     = h.score || 0
    const diff   = sc - par
    const pts    = sc ? Math.max(0, par + extras - sc + 2) : 0
    return { h, i, par, si, extras, sc, diff, pts }
  })

  // Totals
  const totScore = holeData.reduce((s, d) => s + d.sc, 0)
  const totPar   = holeData.reduce((s, d) => s + d.par, 0)
  const totPts   = holeData.reduce((s, d) => s + d.pts, 0)
  const totPutts = round.holes.reduce((s, h) => s + (h.putts || 0), 0)
  const totOB    = round.holes.reduce((s, h) => s + (h.ob || 0), 0)

  let fwH = 0, fwT = 0, girH = 0
  round.holes.forEach(h => {
    if (h.fairway !== null && h.fairway !== undefined) { fwT++; if (h.fairway === 'H' || h.fairway === true) fwH++ }
    if (h.gir) girH++
  })

  function halfSummary(from, to) {
    const slice = holeData.slice(from, to)
    const sc   = slice.reduce((s, d) => s + d.sc, 0)
    const par  = slice.reduce((s, d) => s + d.par, 0)
    const pts  = slice.reduce((s, d) => s + d.pts, 0)
    const putts = round.holes.slice(from, to).reduce((s, h) => s + (h.putts || 0), 0)
    const ob    = round.holes.slice(from, to).reduce((s, h) => s + (h.ob || 0), 0)
    let hFw = 0, tFw = 0, hGir = 0
    round.holes.slice(from, to).forEach(h => {
      if (h.fairway !== null && h.fairway !== undefined) { tFw++; if (h.fairway === 'H' || h.fairway === true) hFw++ }
      if (h.gir) hGir++
    })
    const diff = sc - par
    return { sc, par, pts, putts, ob, hFw, tFw, hGir, n: to - from, diff }
  }

  const out = halfSummary(0, 9)
  const inn = halfSummary(9, 18)

  return (
    <>
      <div className={styles.detailMeta}>
        {formatDate(round.date)} · {round.tee} · HCP {round.handicap}
      </div>

      <div className="stat-chips" style={{ gridTemplateColumns: 'repeat(5,1fr)', padding: '0 0 12px' }}>
        <Chip val={totScore}                                           lbl="Score" />
        <Chip val={playHcp ?? '—'}                                    lbl="Spielvorgabe" />
        <Chip val={fwT ? `${Math.round(fwH / fwT * 100)}%` : '—'}   lbl="Fairway" />
        <Chip val={`${Math.round(girH / 18 * 100)}%`}                lbl="GiR" />
        <Chip val={totPutts}                                          lbl="Putts" />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="dtable">
          <thead>
            <tr>
              <th>Loch</th><th>Par</th><th>Score</th>
              <th>FW</th><th>GiR</th><th>Putts</th><th>OB</th><th>Pkt</th><th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {holeData.map(({ h, i, par, extras, sc, diff, pts }) => (
              <Fragment key={i}>
                <tr>
                  <td>{i + 1}</td>
                  <td>
                    {par}
                    {extras > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 2 }}>
                        {'\\'.repeat(extras)}
                      </span>
                    )}
                  </td>
                  <td><ScoreBadge score={sc || null} netPar={par + extras} size={12} /></td>
                  <td><FwCell h={h} par={par} /></td>
                  <td>{sc ? (h.gir
                    ? <span style={{ color: 'var(--green)' }}>✔</span>
                    : <span style={{ color: 'var(--red)' }}>✗</span>)
                    : '—'}
                  </td>
                  <td style={h.putts >= 3 ? { color: 'var(--red)' } : {}}>{h.putts ?? '—'}</td>
                  <td>{h.ob || 0}</td>
                  <td style={{ color: pts === 0 ? 'var(--red)' : pts >= 3 ? 'var(--gold)' : undefined }}>
                    {sc ? pts : '—'}
                  </td>
                  <td className={diffClass(diff)}>{sc ? diffSign(diff) : '—'}</td>
                </tr>
                {i === 8 && <SummaryRow label="Out" s={out} />}
                {i === 8 && <tr style={{ height: 8, background: 'var(--dark)' }}><td colSpan={9} /></tr>}
              </Fragment>
            ))}
            <SummaryRow label="In" s={inn} />
          </tbody>
          <tfoot>
            <tr style={{ height: 8, background: 'var(--dark)' }}><td colSpan={9} /></tr>
            <tr>
              <td>Total</td>
              <td>{totPar}</td>
              <td>{totScore}</td>
              <td>{fwT ? `${Math.round(fwH / fwT * 100)}%` : '—'}</td>
              <td>{`${Math.round(girH / 18 * 100)}%`}</td>
              <td>{totPutts}</td>
              <td>{totOB}</td>
              <td>{totPts}</td>
              <td className={diffClass(totScore - totPar)}>{diffSign(totScore - totPar)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          className="btn-danger"
          style={confirmDel ? { background: 'var(--red)', color: '#FFF', border: 'none' } : {}}
          onClick={onDelete}
        >
          {confirmDel ? 'Wirklich löschen?' : 'Runde löschen'}
        </button>
      </div>
    </>
  )
}

function Chip({ val, lbl }) {
  return (
    <div className="stat-chip">
      <div className="sc-val">{val}</div>
      <div className="sc-lbl">{lbl}</div>
    </div>
  )
}

function FwCell({ h, par }) {
  if (par <= 3) return <span>—</span>
  if (h.fairway === 'H' || h.fairway === true)  return <span style={{ color: 'var(--green)' }}>✔</span>
  if (h.fairway === 'L') return <span style={{ color: 'var(--red)' }}>◄L</span>
  if (h.fairway === 'R') return <span style={{ color: 'var(--red)' }}>R►</span>
  if (h.fairway === false) return <span style={{ color: 'var(--red)' }}>✗</span>
  return <span>—</span>
}

function SummaryRow({ label, s }) {
  return (
    <tr style={{ background: 'var(--dark3)', fontWeight: 700, fontSize: 12 }}>
      <td>{label}</td>
      <td>{s.par}</td>
      <td>{s.sc}</td>
      <td>{s.tFw ? `${Math.round(s.hFw / s.tFw * 100)}%` : '—'}</td>
      <td>{`${Math.round(s.hGir / s.n * 100)}%`}</td>
      <td>{s.putts}</td>
      <td>{s.ob}</td>
      <td>{s.pts}</td>
      <td className={diffClass(s.diff)}>{diffSign(s.diff)}</td>
    </tr>
  )
}
