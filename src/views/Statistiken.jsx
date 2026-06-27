import { useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import { calcStats, calcEstWhs, getBest8Dates, formatDate, diffClass } from '../utils/golf'
import styles from './Statistiken.module.css'

const FILTERS = [
  { val: 'all', label: 'Alle' },
  { val: 5,     label: '5 Runden' },
  { val: 10,    label: '10 Runden' },
  { val: 'year', label: 'Aktuelles Jahr' },
]

const DIST_ORDER = ['eagle', 'birdie', 'par', 'bogey', 'doppel', 'triple']
const DIST_LABELS = { eagle: 'Eagle', birdie: 'Birdie', par: 'Par', bogey: 'Bogey', doppel: 'Doppel', triple: 'Dreifach+' }

function filteredRounds(rounds, filter) {
  const sorted = rounds.slice().sort((a, b) => b.date.localeCompare(a.date))
  if (filter === 5)      return sorted.slice(0, 5)
  if (filter === 10)     return sorted.slice(0, 10)
  if (filter === 'year') { const yr = String(new Date().getFullYear()); return sorted.filter(r => r.date.startsWith(yr)) }
  return sorted
}

export default function Statistiken({ data }) {
  const { rounds, courses, hcpLog, saveHcpEntry, deleteHcpEntry, hcpLogSorted } = data
  const [filter, setFilter]         = useState('all')
  const [showHcp, setShowHcp]       = useState(false)
  const [hcpForm, setHcpForm]       = useState({ date: new Date().toISOString().slice(0, 10), hcp: '', note: '' })

  const subset = filteredRounds(rounds, filter)
  const s      = calcStats(subset, courses)
  const estWhs = calcEstWhs(hcpLog)
  const best8  = getBest8Dates(hcpLog)
  const hcpSorted = hcpLogSorted()

  function handleAddHcp() {
    if (!hcpForm.date || !hcpForm.hcp) return
    saveHcpEntry({ date: hcpForm.date, hcp: parseFloat(hcpForm.hcp), note: hcpForm.note || '' })
    setHcpForm({ date: new Date().toISOString().slice(0, 10), hcp: '', note: '' })
  }

  return (
    <div style={{ paddingTop: 12 }}>

      {/* Filter */}
      <div className={styles.filterRow}>
        {FILTERS.map(f => (
          <button
            key={f.val}
            className={`${styles.fchip} ${filter === f.val ? styles.fchipOn : ''}`}
            onClick={() => setFilter(f.val)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!s ? (
        <>
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">Noch keine Runden</div>
            <div className="empty-sub">Erfasse deine erste Runde um Statistiken zu sehen</div>
          </div>
          <HcpKurve hcpSorted={hcpSorted} best8={best8} estWhs={estWhs} onAdd={() => setShowHcp(true)} />
        </>
      ) : (
        <>
          {/* Hero */}
          <div style={{ padding: '0 12px 0' }}>
            <div className={styles.hero}>
              <div className={styles.heroLabel}>{s.rCount} {s.rCount === 1 ? 'Runde' : 'Runden'}</div>
              <div className={styles.heroScore}>{s.avgScore}</div>
              <div className={styles.heroSub}>Durchschnitt Brutto</div>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="stat-chips" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <Chip val={s.avgScore}                                lbl="Score Ø" />
            <Chip val={s.fwPct !== null ? `${s.fwPct}%` : '—'}  lbl="Fairway %" />
            <Chip val={s.girPct !== null ? `${s.girPct}%` : '—'} lbl="GiR %" />
            <Chip val={s.avgPutts}                               lbl="Putts Ø" />
            <Chip val={s.scrPct !== null ? `${s.scrPct}%` : '—'} lbl="Scrambling" />
            <Chip val={s.avgOB}                                  lbl="OB Ø" />
            <Chip val={s.bigMissPerRound} lbl="BigMiss Ø" valStyle={{ color: 'var(--red)' }} />
          </div>

          {/* Putt-Analyse */}
          <div className="card">
            <div className="card-hdr"><div className="card-title">Putt-Analyse</div></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
              <PuttStat val={s.onePuttPct !== null ? `${s.onePuttPct}%` : '—'} lbl="1-Putt"    color="var(--green)" />
              <PuttStat val={s.avgPutts}                                        lbl="Ø / Runde" />
              <PuttStat
                val={s.puttPerGir ?? '—'}
                lbl="Putts/GiR"
                color={s.puttPerGir !== null
                  ? parseFloat(s.puttPerGir) <= 1.8 ? 'var(--green)'
                  : parseFloat(s.puttPerGir) >= 2.0 ? 'var(--red)' : undefined
                  : undefined}
              />
              <PuttStat val={s.threePlusPct !== null ? `${s.threePlusPct}%` : '—'} lbl="3+ Putts" color="var(--red)" />
            </div>
          </div>

          {/* Score-Verteilung */}
          <div className="card">
            <div className="card-hdr"><div className="card-title">Score-Verteilung</div></div>
            <div className="card-body">
              {DIST_ORDER.map(k => (
                <div key={k} className={styles.distRow}>
                  <div className={styles.distLbl}>{DIST_LABELS[k]}</div>
                  <div className={styles.distBg}>
                    <div
                      className={`${styles.distBar} ${styles['dist_' + k]}`}
                      style={{ width: s.maxDist ? `${Math.round((s.dist[k] || 0) / s.maxDist * 100)}%` : '0%' }}
                    />
                  </div>
                  <div className={styles.distN}>{s.dist[k] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Nach Par-Typ */}
          <div style={{ padding: '0 12px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--grey-l)' }}>
            Nach Par-Typ
          </div>
          <div className={styles.parGrid}>
            {[3, 4, 5].map(p => {
              const d = s.byPar[p]
              if (!d || !d.n) return <div key={p} className={styles.parCard}><div className={styles.parCardLbl}>Par {p}</div><div className={styles.parCardVal}>—</div><div className="clr-neu" style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>—</div></div>
              const avg = d.s / d.n, diff = avg - p
              const sign = diff > 0 ? '+' : ''
              return (
                <div key={p} className={styles.parCard}>
                  <div className={styles.parCardLbl}>Par {p}</div>
                  <div className={styles.parCardVal}>{avg.toFixed(1)}</div>
                  <div className={`${diffClass(diff)}`} style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{sign}{diff.toFixed(2)}</div>
                </div>
              )
            })}
          </div>

          {/* Schwächste / Stärkste Löcher */}
          {s.holeArr.length > 0 && (
            <div className="card">
              <div className="card-hdr"><div className="card-title">Schwächste Löcher</div></div>
              {s.holeArr.slice(0, 3).map(h => <HoleRow key={h.hole} h={h} />)}
            </div>
          )}
          {s.holeArr.length > 0 && (
            <div className="card">
              <div className="card-hdr"><div className="card-title">Stärkste Löcher</div></div>
              {s.holeArr.slice(-3).reverse().map(h => <HoleRow key={h.hole} h={h} />)}
            </div>
          )}

          <HcpKurve hcpSorted={hcpSorted} best8={best8} estWhs={estWhs} onAdd={() => setShowHcp(true)} />
        </>
      )}

      {/* HCP Sheet */}
      <BottomSheet isOpen={showHcp} onClose={() => setShowHcp(false)} title="HCP-Verlauf">
        <div>
          {hcpSorted.slice().reverse().map(e => {
            const ds = formatDate(e.date)
            return (
              <div key={e.date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>HCP {e.hcp}</div>
                  <div style={{ fontSize: 11, color: 'var(--grey)' }}>{ds}{e.note ? ` · ${e.note}` : ''}</div>
                </div>
                <button
                  onClick={() => deleteHcpEntry(e.date)}
                  style={{ background: 'none', border: 'none', color: 'var(--grey)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
                >×</button>
              </div>
            )
          })}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Neuer Eintrag</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: 13, padding: '9px 8px' }}
                value={hcpForm.date}
                onChange={e => setHcpForm(f => ({ ...f, date: e.target.value }))}
              />
              <input
                type="number"
                className="form-input"
                placeholder="14.3"
                step="0.1" min="0" max="54"
                style={{ fontSize: 13, padding: '9px 6px', textAlign: 'center' }}
                value={hcpForm.hcp}
                onChange={e => setHcpForm(f => ({ ...f, hcp: e.target.value }))}
              />
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Notiz (optional)"
              style={{ fontSize: 13, padding: '9px 8px', marginBottom: 8 }}
              value={hcpForm.note}
              onChange={e => setHcpForm(f => ({ ...f, note: e.target.value }))}
            />
            <button className="btn-primary" onClick={handleAddHcp}>+ Eintrag hinzufügen</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

function Chip({ val, lbl, valStyle }) {
  return (
    <div className="stat-chip">
      <div className="sc-val" style={valStyle}>{val}</div>
      <div className="sc-lbl">{lbl}</div>
    </div>
  )
}

function PuttStat({ val, lbl, color }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? 'var(--white)' }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--grey)', marginTop: 2 }}>{lbl}</div>
    </div>
  )
}

function HoleRow({ h }) {
  const sign = h.diff > 0 ? '+' : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, width: 36, flexShrink: 0 }}>{h.hole}</div>
      <div style={{ fontSize: 11, color: 'var(--grey)', flex: 1 }}>Par {h.par} · {h.n} Rdn</div>
      <div style={{ fontSize: 13, fontWeight: 700, marginRight: 10 }}>{h.avg.toFixed(2)}</div>
      <div className={diffClass(h.diff)} style={{ fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{sign}{h.diff.toFixed(2)}</div>
    </div>
  )
}

function HcpKurve({ hcpSorted, best8, estWhs, onAdd }) {
  const hcpMax = Math.max(...hcpSorted.map(e => e.hcp || 0), 1)
  return (
    <div className="card">
      <div className="card-hdr">
        <div style={{ flex: 1 }}>
          <div className="card-title">Handicap-Entwicklung</div>
          {estWhs !== null && (
            <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 1 }}>
              WHS Schätzung: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{estWhs}</span>
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          style={{ background: 'none', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: 'var(--grey)', cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          + Eintrag
        </button>
      </div>
      <div className="card-body" style={{ padding: '10px 14px' }}>
        {hcpSorted.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--grey)', textAlign: 'center', padding: '8px 0' }}>Noch keine Einträge.</div>
        ) : (
          hcpSorted.map((e, i) => {
            const hcp  = e.hcp || 0
            const pct  = Math.round(hcp / hcpMax * 100)
            const prev = i > 0 ? (hcpSorted[i - 1].hcp || 0) : hcp
            const arr  = hcp < prev ? '↓' : hcp > prev ? '↑' : '→'
            const ac   = hcp < prev ? 'var(--green)' : hcp > prev ? 'var(--red)' : 'var(--grey)'
            const counted = best8[e.date]
            const dp   = e.date.split('-')
            const ds   = `${dp[2]}.${dp[1]}.${dp[0].slice(2)}`
            return (
              <div
                key={e.date}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '2px 4px',
                  ...(counted ? { background: 'rgba(212,175,55,0.18)', borderRadius: 4, borderLeft: '3px solid var(--gold)' } : {}),
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: counted ? 'var(--gold)' : 'transparent', flexShrink: 0 }} />
                <div style={{ width: 48, fontSize: 10, color: 'var(--grey)' }}>{ds}</div>
                <div style={{ flex: 1, height: 9 }}>
                  <div style={{ width: `${pct}%`, background: 'var(--gold)', borderRadius: 4, height: 9 }} />
                </div>
                <div style={{ width: 32, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{hcp}</div>
                <div style={{ width: 28, fontSize: 10, color: 'var(--grey)', textAlign: 'right' }}>{e.score || ''}</div>
                <div style={{ width: 36, fontSize: 10, color: counted ? 'var(--gold)' : 'var(--grey)', textAlign: 'right', fontWeight: counted ? 700 : 400 }}>
                  {e.asd !== null && e.asd !== undefined ? e.asd : ''}
                </div>
                <div style={{ width: 14, fontSize: 11, color: ac, textAlign: 'center' }}>{arr}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
