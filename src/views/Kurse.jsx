import { useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import styles from './Kurse.module.css'

const defaultNewCourse = () => ({
  name: '',
  holes: Array.from({ length: 18 }, (_, i) => ({ par: 4, si: i + 1 })),
  tees: [],
})

export default function Kurse({ data }) {
  const { courses, saveCourse, deleteCourse, courseList } = data

  const [detailId, setDetailId]     = useState(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [addStep, setAddStep]       = useState(0)
  const [newCourse, setNewCourse]   = useState(defaultNewCourse)

  const list = courseList()
  const detail = detailId ? courses[detailId] : null

  function openDetail(id) {
    setDetailId(id)
    setConfirmDel(false)
  }

  function closeDetail() {
    setDetailId(null)
    setConfirmDel(false)
  }

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    deleteCourse(detailId)
    closeDetail()
  }

  function openAdd() {
    setNewCourse(defaultNewCourse())
    setAddStep(0)
    setShowAdd(true)
  }

  function closeAdd() {
    setShowAdd(false)
    setAddStep(0)
  }

  function setHolePar(i, par) {
    setNewCourse(c => {
      const holes = c.holes.map((h, idx) => idx === i ? { ...h, par } : h)
      return { ...c, holes }
    })
  }

  function setHoleSi(i, si) {
    setNewCourse(c => {
      const holes = c.holes.map((h, idx) => idx === i ? { ...h, si: parseInt(si) || 0 } : h)
      return { ...c, holes }
    })
  }

  function addTee() {
    setNewCourse(c => ({ ...c, tees: [...c.tees, { name: '', cr: '', sr: '' }] }))
  }

  function removeTee(i) {
    setNewCourse(c => ({ ...c, tees: c.tees.filter((_, idx) => idx !== i) }))
  }

  function setTeeField(i, field, value) {
    setNewCourse(c => {
      const tees = c.tees.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
      return { ...c, tees }
    })
  }

  function nextStep() {
    if (addStep === 0) {
      if (!newCourse.name.trim()) return
      setAddStep(1)
    } else if (addStep === 1) {
      setAddStep(2)
    } else {
      const id = 'c_' + Date.now()
      saveCourse(id, {
        id,
        name: newCourse.name.trim(),
        holes: newCourse.holes,
        tees: newCourse.tees.map(t => ({
          name: t.name,
          cr: parseFloat(t.cr) || 0,
          sr: parseInt(t.sr) || 0,
        })),
      })
      closeAdd()
    }
  }

  const addTitles = ['Schritt 1: Name', 'Schritt 2: Löcher', 'Schritt 3: Abschläge']

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ padding: '0 12px 12px' }}>
        <button className="btn-primary" onClick={openAdd}>+ Kurs hinzufügen</button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-text">Noch keine Kurse</div>
          <div className="empty-sub">Lege deinen ersten Golfkurs an</div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 0 }}>
          {list.map(course => {
            const par = course.holes.reduce((s, h) => s + (h.par || 4), 0)
            const tees = (course.tees || []).map(t => t.name).join(', ') || '—'
            return (
              <div key={course.id} className="list-row" onClick={() => openDetail(course.id)}>
                <div className="list-row-main">
                  <div className="list-row-title">{course.name}</div>
                  <div className="list-row-sub">Par {par} · {tees}</div>
                </div>
                <div style={{ color: 'var(--grey)', fontSize: 18 }}>›</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Kurs-Detail ── */}
      <BottomSheet isOpen={!!detailId} onClose={closeDetail} title={detail?.name || ''}>
        {detail && (
          <>
            <div style={{ marginBottom: 12 }}>
              <span className={styles.parBadge}>
                Par {detail.holes.reduce((s, h) => s + (h.par || 4), 0)}
              </span>
            </div>

            <div className={styles.sectionLabel}>Abschläge</div>
            <table className="dtable" style={{ marginBottom: 16 }}>
              <thead>
                <tr><th>Abschlag</th><th>CR</th><th>SR</th></tr>
              </thead>
              <tbody>
                {(detail.tees || []).length === 0 ? (
                  <tr><td colSpan={3} style={{ color: 'var(--grey)', textAlign: 'center' }}>—</td></tr>
                ) : (
                  (detail.tees || []).map((t, i) => (
                    <tr key={i}><td>{t.name}</td><td>{t.cr}</td><td>{t.sr}</td></tr>
                  ))
                )}
              </tbody>
            </table>

            <div className={styles.sectionLabel}>Löcher</div>
            <div className={styles.holeGrid}>
              {detail.holes.map((h, i) => (
                <div key={i} className={styles.holeCell}>
                  <div className={styles.holeCellNum}>{i + 1}</div>
                  <div className={styles.holeCellPar}>{h.par}</div>
                </div>
              ))}
            </div>

            <button
              className="btn-danger"
              style={confirmDel ? { background: 'var(--red)', color: '#FFF', border: 'none' } : {}}
              onClick={handleDelete}
            >
              {confirmDel ? 'Wirklich löschen?' : 'Kurs löschen'}
            </button>
          </>
        )}
      </BottomSheet>

      {/* ── Kurs hinzufügen ── */}
      <BottomSheet isOpen={showAdd} onClose={closeAdd} title={addTitles[addStep]}>
        {addStep === 0 && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Kursname</label>
              <input
                className="form-input"
                placeholder="z.B. Golfpark Davos"
                maxLength={50}
                value={newCourse.name}
                onChange={e => setNewCourse(c => ({ ...c, name: e.target.value }))}
              />
            </div>
            <button className="btn-primary" onClick={nextStep}>Weiter →</button>
          </div>
        )}

        {addStep === 1 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 12 }}>
              SI ist optional (Stroke Index pro Loch)
            </div>
            {newCourse.holes.map((h, i) => (
              <div key={i} className={styles.holeCfgRow}>
                <div className={styles.holeCfgNum}>{i + 1}</div>
                <div className={styles.holeCfgPar}>
                  <div className={styles.parBtnGroup}>
                    {[3, 4, 5].map(p => (
                      <button
                        key={p}
                        className={`${styles.parBtn} ${h.par === p ? styles.parBtnOn : ''}`}
                        onClick={() => setHolePar(i, p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  className={styles.siInput}
                  type="number"
                  min={1}
                  max={18}
                  placeholder="SI"
                  value={h.si || ''}
                  onChange={e => setHoleSi(i, e.target.value)}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setAddStep(0)}>← Zurück</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={nextStep}>Weiter →</button>
            </div>
          </div>
        )}

        {addStep === 2 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 12 }}>
              CR = Course Rating, SR = Slope Rating
            </div>
            {newCourse.tees.map((t, i) => (
              <div key={i} className={styles.teeRow}>
                <input
                  className="form-input"
                  style={{ flex: 2, fontSize: 13 }}
                  placeholder="Name"
                  value={t.name}
                  onChange={e => setTeeField(i, 'name', e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '12px 6px' }}
                  type="number"
                  placeholder="CR"
                  step="0.1"
                  value={t.cr}
                  onChange={e => setTeeField(i, 'cr', e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ flex: 1, textAlign: 'center', fontSize: 13, padding: '12px 6px' }}
                  type="number"
                  placeholder="SR"
                  value={t.sr}
                  onChange={e => setTeeField(i, 'sr', e.target.value)}
                />
                <button className={styles.teeDel} onClick={() => removeTee(i)}>✕</button>
              </div>
            ))}
            <button
              className="btn-secondary"
              style={{ marginBottom: 14 }}
              onClick={addTee}
            >
              + Abschlag
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setAddStep(1)}>← Zurück</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={nextStep}>Kurs speichern ✓</button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
