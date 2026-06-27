import { useLocalStorage } from './useLocalStorage'
import { calcEstWhs } from '../utils/golf'

export function useGolfData() {
  const [rounds, setRounds] = useLocalStorage('ga_rounds', [])
  const [courses, setCourses] = useLocalStorage('ga_courses', {})
  const [hcpLog, setHcpLog] = useLocalStorage('ga_hcp_log', [])

  // --- Runden ---

  function saveRound(round) {
    setRounds((prev) => [...prev, round])
  }

  function saveRoundComplete(round) {
    setRounds((prev) => [...prev, round])

    const course = courses[round.courseId]
    const courseName = course?.name ?? 'General Play'
    const bruttoTotal = round.holes.reduce((s, h) => s + (h?.score ?? 0), 0)
    const teeData = course?.tees?.find((t) => t.name === round.tee) ?? null
    const asd =
      teeData && bruttoTotal
        ? Math.round(((bruttoTotal - teeData.cr) * 113) / teeData.sr * 10) / 10
        : null

    setHcpLog((prev) => {
      const filtered = prev.filter((e) => e.date !== round.date)
      const newEntry = {
        date: round.date,
        hcp: round.handicap,
        note: courseName,
        score: bruttoTotal,
        asd,
        roundId: round.id,
      }
      const withNew = [...filtered, newEntry]
      const newWhs = calcEstWhs(withNew)
      if (newWhs !== null) {
        return withNew.map((e) => (e === newEntry ? { ...e, hcp: newWhs } : e))
      }
      return withNew
    })
  }

  function deleteRound(roundId) {
    const round = rounds.find((r) => r.id === roundId)
    setRounds((prev) => prev.filter((r) => r.id !== roundId))
    setHcpLog((prev) =>
      prev.filter((e) => {
        if (e.roundId === roundId) return false
        if (!e.roundId && round && e.date === round.date && e.score != null) return false
        return true
      })
    )
  }

  function roundsSorted() {
    return rounds.slice().sort((a, b) => b.date.localeCompare(a.date))
  }

  // --- Kurse ---

  function saveCourse(id, course) {
    setCourses((prev) => ({ ...prev, [id]: course }))
  }

  function deleteCourse(id) {
    setCourses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function courseList() {
    return Object.entries(courses).map(([id, course]) => ({ id, ...course }))
  }

  // --- HCP-Log ---

  function saveHcpEntry(entry) {
    setHcpLog((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date)
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  function deleteHcpEntry(date) {
    setHcpLog((prev) => prev.filter((e) => e.date !== date))
  }

  function hcpLogSorted() {
    return hcpLog.slice().sort((a, b) => a.date.localeCompare(b.date))
  }

  function latestHcp() {
    if (!hcpLog.length) return null
    return hcpLog.slice().sort((a, b) => b.date.localeCompare(a.date))[0].hcp
  }

  return {
    // Rohdaten
    rounds,
    courses,
    hcpLog,

    // Runden
    saveRound,
    saveRoundComplete,
    deleteRound,
    roundsSorted,

    // Kurse
    saveCourse,
    deleteCourse,
    courseList,

    // HCP-Log
    saveHcpEntry,
    deleteHcpEntry,
    hcpLogSorted,
    latestHcp,
  }
}
