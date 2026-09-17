import type { ISODate, Run, RunType } from '../db/types'
import { endOfWeek, parseISO, startOfWeek, todayISO } from './date'
import { sortByDate } from './body'

export const RUN_TYPES: { value: RunType; label: string; short: string }[] = [
  { value: 'outdoor', label: 'Esterno', short: 'est.' },
  { value: 'treadmill', label: 'Tapis roulant', short: 'tapis' },
]

export function runTypeLabel(type: RunType): string {
  return RUN_TYPES.find((t) => t.value === type)?.label ?? type
}

/** Passo in secondi per km. */
export function paceSecPerKm(distanceKm: number, durationSec: number): number | undefined {
  if (!(distanceKm > 0) || !(durationSec > 0)) return undefined
  return durationSec / distanceKm
}

/** Velocita' media in km/h. */
export function speedKmh(distanceKm: number, durationSec: number): number | undefined {
  if (!(distanceKm > 0) || !(durationSec > 0)) return undefined
  return (distanceKm / durationSec) * 3600
}

/** Distanza minima perche' un passo conti come record (evita gli scatti brevi). */
export const RECORD_MIN_KM = 1

export interface RunStats {
  count: number
  totalKm: number
  totalSec: number
  longest?: Run
  bestPace?: Run
  longestDuration?: Run
}

export function runStats(runs: Run[]): RunStats {
  const stats: RunStats = { count: runs.length, totalKm: 0, totalSec: 0 }
  for (const r of runs) {
    stats.totalKm += r.distanceKm
    stats.totalSec += r.durationSec
    if (!stats.longest || r.distanceKm > stats.longest.distanceKm) stats.longest = r
    if (!stats.longestDuration || r.durationSec > stats.longestDuration.durationSec) stats.longestDuration = r
    if (r.distanceKm >= RECORD_MIN_KM) {
      const p = paceSecPerKm(r.distanceKm, r.durationSec)!
      const best = stats.bestPace ? paceSecPerKm(stats.bestPace.distanceKm, stats.bestPace.durationSec)! : Infinity
      if (p < best) stats.bestPace = r
    }
  }
  return stats
}

/** Corse della settimana (lunedi'-domenica) che contiene `date`. */
export function runsInWeek(runs: Run[], date: ISODate = todayISO()): Run[] {
  const from = startOfWeek(date)
  const to = endOfWeek(date)
  return runs.filter((r) => r.date >= from && r.date <= to)
}

export interface RunPoint {
  id: number
  t: number
  date: ISODate
  label: string
  distanceKm: number
  durationSec: number
  paceSec: number
  type: RunType
  feeling: number
  avgHr?: number
}

/** Corse in ordine cronologico, con passo gia' calcolato, per grafici e tabelle. */
export function runPoints(runs: Run[]): RunPoint[] {
  return sortByDate(runs).map((r) => ({
    id: r.id!,
    t: parseISO(r.date).getTime(),
    date: r.date,
    label: r.date,
    distanceKm: r.distanceKm,
    durationSec: r.durationSec,
    paceSec: paceSecPerKm(r.distanceKm, r.durationSec) ?? 0,
    type: r.type,
    feeling: r.feeling,
    avgHr: r.avgHr,
  }))
}

export type RunRecordKind = 'distance' | 'pace' | 'duration'

export interface RunRecord {
  kind: RunRecordKind
  date: ISODate
  run: Run
}

/**
 * Record personali in ordine cronologico: ogni volta che una corsa supera
 * il massimo precedente (distanza, durata) o il miglior passo, e' un record.
 * La prima corsa non conta come record.
 */
export function runRecords(runs: Run[]): RunRecord[] {
  const out: RunRecord[] = []
  let maxKm = -Infinity
  let maxSec = -Infinity
  let bestPace = Infinity
  sortByDate(runs).forEach((r, i) => {
    const pace = r.distanceKm >= RECORD_MIN_KM ? paceSecPerKm(r.distanceKm, r.durationSec)! : Infinity
    if (i > 0) {
      if (r.distanceKm > maxKm) out.push({ kind: 'distance', date: r.date, run: r })
      if (r.durationSec > maxSec) out.push({ kind: 'duration', date: r.date, run: r })
      if (pace < bestPace) out.push({ kind: 'pace', date: r.date, run: r })
    }
    maxKm = Math.max(maxKm, r.distanceKm)
    maxSec = Math.max(maxSec, r.durationSec)
    bestPace = Math.min(bestPace, pace)
  })
  return out
}

/** Frequenza cardiaca massima stimata (formula classica 220 − eta'). */
export function estimatedMaxHr(birthYear: number | undefined): number | undefined {
  if (!birthYear) return undefined
  const age = new Date().getFullYear() - birthYear
  return age > 0 && age < 120 ? 220 - age : undefined
}
