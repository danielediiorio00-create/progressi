import type { Exercise, GymSession, ISODate, Run, Settings } from '../db/types'
import { addDays, startOfWeek, todayISO } from './date'
import { fmtDuration, fmtNum, fmtPace, fmtSigned } from './format'
import { gymRecords } from './gym'
import { paceSecPerKm, runRecords, runsInWeek } from './running'
import { sessionsInWeek } from './gym'

export interface WeekProgress {
  weekStart: ISODate
  runs: number
  gym: number
  runTarget: number
  gymTarget: number
  /** True se entrambi gli obiettivi sono raggiunti. */
  met: boolean
}

export function weekProgress(runs: Run[], gym: GymSession[], settings: Settings, date: ISODate = todayISO()): WeekProgress {
  const r = runsInWeek(runs, date).length
  const g = sessionsInWeek(gym, date).length
  return {
    weekStart: startOfWeek(date),
    runs: r,
    gym: g,
    runTarget: settings.weeklyRunTarget,
    gymTarget: settings.weeklyGymTarget,
    met: r >= settings.weeklyRunTarget && g >= settings.weeklyGymTarget,
  }
}

/**
 * Settimane consecutive con obiettivo raggiunto. La settimana in corso conta
 * solo se e' gia' a obiettivo: se non lo e' ancora, non interrompe la serie.
 */
export function goalStreak(runs: Run[], gym: GymSession[], settings: Settings, today: ISODate = todayISO()): number {
  if (settings.weeklyRunTarget + settings.weeklyGymTarget === 0) return 0
  const firstDate = [...runs.map((r) => r.date), ...gym.map((s) => s.date)].sort()[0]
  if (!firstDate) return 0
  let streak = 0
  let week = startOfWeek(today)
  if (!weekProgress(runs, gym, settings, week).met) week = addDays(week, -7)
  while (week >= startOfWeek(firstDate) && streak < 520) {
    if (!weekProgress(runs, gym, settings, week).met) break
    streak++
    week = addDays(week, -7)
  }
  return streak
}

export interface RecordItem {
  date: ISODate
  kind: 'run' | 'gym'
  title: string
  value: string
  /** Es. "+2 kg" o "prima 5,2 km". */
  detail?: string
}

/** Ultimi record personali di corsa e palestra, dal piu' recente. */
export function latestRecords(runs: Run[], gym: GymSession[], exercises: Exercise[], limit = 4): RecordItem[] {
  const items: RecordItem[] = []
  for (const r of runRecords(runs)) {
    if (r.kind === 'distance') items.push({ date: r.date, kind: 'run', title: 'Corsa più lunga', value: `${fmtNum(r.run.distanceKm, 2)} km` })
    else if (r.kind === 'pace') items.push({ date: r.date, kind: 'run', title: 'Passo migliore', value: fmtPace(paceSecPerKm(r.run.distanceKm, r.run.durationSec), true) })
    else items.push({ date: r.date, kind: 'run', title: 'Corsa più lunga per tempo', value: fmtDuration(r.run.durationSec) })
  }
  for (const g of gymRecords(gym, exercises)) {
    const unit = g.exercise.mode === 'time' ? 's' : 'kg'
    items.push({
      date: g.date,
      kind: 'gym',
      title: g.exercise.name,
      value: `${fmtNum(g.value, 1)} ${unit}`,
      detail: `${fmtSigned(g.value - g.previous, 1)} ${unit}`,
    })
  }
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, limit)
}

/** "Buongiorno", "Buon pomeriggio" o "Buonasera" in base all'ora. */
export function greeting(hour = new Date().getHours()): string {
  if (hour < 5) return 'Buonanotte'
  if (hour < 13) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}
