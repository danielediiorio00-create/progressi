import type { Exercise, GymEntry, GymSession, ISODate } from '../db/types'
import { endOfWeek, parseISO, startOfWeek, todayISO } from './date'
import { fmtNum } from './format'
import { sortByDate } from './body'

export type ExerciseMap = Map<number, Exercise>

export function exerciseMap(exercises: Exercise[]): ExerciseMap {
  return new Map(exercises.map((e) => [e.id!, e]))
}

/** Sedute della settimana (lunedi'-domenica) che contiene `date`. */
export function sessionsInWeek(sessions: GymSession[], date: ISODate = todayISO()): GymSession[] {
  const from = startOfWeek(date)
  const to = endOfWeek(date)
  return sessions.filter((s) => s.date >= from && s.date <= to)
}

/** Numero totale di serie in una seduta. */
export function sessionSets(session: GymSession): number {
  return session.entries.reduce((n, e) => n + e.sets, 0)
}

/** Volume (serie x ripetizioni x kg) degli esercizi a ripetizioni con carico. */
export function sessionVolume(session: GymSession, exercises: ExerciseMap): number {
  return session.entries.reduce((v, e) => {
    const ex = exercises.get(e.exerciseId)
    if (!ex || ex.mode !== 'reps' || !e.weightKg) return v
    return v + e.sets * e.reps * e.weightKg
  }, 0)
}

/** "3×12×60 kg" oppure "3×45 s" per gli esercizi a tempo. */
export function formatEntry(entry: GymEntry, exercise: Exercise | undefined): string {
  const time = exercise?.mode === 'time'
  const base = time ? `${entry.sets}×${entry.reps} s` : `${entry.sets}×${entry.reps}`
  const load = entry.weightKg ? `×${fmtNum(entry.weightKg, 1)} kg` : time ? '' : ' a corpo libero'
  return base + load
}

/** Riassunto compatto di una seduta: "Leg press 60 kg · Goblet squat 16 kg · +2". */
export function sessionSummary(session: GymSession, exercises: ExerciseMap, max = 3): string {
  const parts = session.entries.map((e) => {
    const ex = exercises.get(e.exerciseId)
    const name = ex?.name ?? 'Esercizio'
    if (ex?.mode === 'time') return `${name} ${e.reps} s`
    return e.weightKg ? `${name} ${fmtNum(e.weightKg, 1)} kg` : name
  })
  const shown = parts.slice(0, max)
  const rest = parts.length - shown.length
  return shown.join(' · ') + (rest > 0 ? ` · +${rest}` : '')
}

/** Ultima volta che un esercizio e' stato fatto: serve per precompilare il modulo. */
export function lastEntryFor(sessions: GymSession[], exerciseId: number): { date: ISODate; entry: GymEntry } | undefined {
  const sorted = sortByDate(sessions)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const entry = sorted[i].entries.find((e) => e.exerciseId === exerciseId)
    if (entry) return { date: sorted[i].date, entry }
  }
  return undefined
}

export interface LoadPoint {
  t: number
  date: ISODate
  /** Carico in kg, oppure secondi per gli esercizi a tempo. */
  value: number
  sets: number
  reps: number
  rir?: number
}

/** Progressione di un esercizio nel tempo (una voce per seduta). */
export function exercisePoints(sessions: GymSession[], exercise: Exercise): LoadPoint[] {
  const out: LoadPoint[] = []
  for (const s of sortByDate(sessions)) {
    const entry = s.entries.find((e) => e.exerciseId === exercise.id)
    if (!entry) continue
    const value = exercise.mode === 'time' ? entry.reps : entry.weightKg
    if (value === undefined) continue
    out.push({ t: parseISO(s.date).getTime(), date: s.date, value, sets: entry.sets, reps: entry.reps, rir: entry.rir })
  }
  return out
}

export interface GymRecord {
  exercise: Exercise
  date: ISODate
  /** Nuovo massimo: kg oppure secondi. */
  value: number
  previous: number
}

/**
 * Record: ogni volta che il carico (o i secondi) di un esercizio supera
 * il massimo precedente. La prima volta non conta.
 */
export function gymRecords(sessions: GymSession[], exercises: Exercise[]): GymRecord[] {
  const out: GymRecord[] = []
  for (const ex of exercises) {
    let max = -Infinity
    for (const p of exercisePoints(sessions, ex)) {
      if (max !== -Infinity && p.value > max) out.push({ exercise: ex, date: p.date, value: p.value, previous: max })
      max = Math.max(max, p.value)
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** True se l'esercizio compare in almeno una seduta (quindi non va cancellato, solo archiviato). */
export function isExerciseUsed(sessions: GymSession[], exerciseId: number): boolean {
  return sessions.some((s) => s.entries.some((e) => e.exerciseId === exerciseId))
}
