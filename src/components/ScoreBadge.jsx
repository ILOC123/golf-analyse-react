import { scoreBadgeClass } from '../utils/golf'

export default function ScoreBadge({ score, netPar, size = 13 }) {
  if (!score) return <span>—</span>
  const diff = score - netPar
  const cls  = scoreBadgeClass(diff)
  const dim  = Math.round(size * 1.9)
  if (!cls) return <span style={{ fontWeight: 700, fontSize: size }}>{score}</span>
  return (
    <span className={`sc-badge ${cls}`} style={{ width: dim, height: dim, fontSize: size }}>
      {score}
    </span>
  )
}
