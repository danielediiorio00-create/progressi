import type { BodyEntry, Exercise, GymSession, ISODate, Plan, Run, Settings } from '../db/types'
import { addDays, endOfWeek, formatDate, parseISO, startOfWeek, todayISO } from './date'
import { fmtDuration, fmtNum, fmtPace, fmtSigned } from './format'
import { CIRCUMFERENCES, sortByDate } from './body'
import { paceSecPerKm, runTypeLabel } from './running'
import { exerciseMap, formatEntry } from './gym'
import { formatPlanExercise } from './plan'
import { goalStreak, weekProgress } from './dashboard'

export type ReportDays = 7 | 30 | 90

export interface ReportInput {
  settings: Settings
  body: BodyEntry[]
  runs: Run[]
  gym: GymSession[]
  exercises: Exercise[]
  days: ReportDays
  notes: string
  /** Scheda attuale, se esiste. */
  plan?: Plan
  today?: ISODate
}

const inRange = <T extends { date: ISODate }>(items: T[], from: ISODate, to: ISODate) => items.filter((i) => i.date >= from && i.date <= to)

/** "24–30 ago" oppure "31 ago – 6 set". */
function weekLabel(start: ISODate): string {
  const end = endOfWeek(start)
  const s = parseISO(start)
  const e = parseISO(end)
  const month = (d: Date) => new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(d)
  return s.getMonth() === e.getMonth() ? `${s.getDate()}–${e.getDate()} ${month(e)}` : `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)}`
}

function periodLabel(from: ISODate, to: ISODate): string {
  const f = parseISO(from)
  const t = parseISO(to)
  const fmt = (d: Date, year: boolean) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }).format(d)
  return `${fmt(f, f.getFullYear() !== t.getFullYear())} – ${fmt(t, true)}`
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : undefined)

/** Testo Markdown compatto da incollare in una chat con il coach. */
export function buildReport(input: ReportInput): string {
  const { settings, exercises, days } = input
  const today = input.today ?? todayISO()
  const from = addDays(today, -(days - 1))
  const prevFrom = addDays(from, -days)
  const prevTo = addDays(from, -1)
  const body = sortByDate(input.body)
  const runs = sortByDate(input.runs)
  const gym = sortByDate(input.gym)
  const out: string[] = []

  out.push(`# Report allenamento · ultimi ${days} giorni (${periodLabel(from, today)})`, '')

  // ---- Profilo -------------------------------------------------------------
  const year = parseISO(today).getFullYear()
  const age = settings.birthYear ? year - settings.birthYear : undefined
  const weighedAll = body.filter((b) => b.weightKg !== undefined)
  const lastWeigh = weighedAll[weighedAll.length - 1]
  const currentAvg = lastWeigh ? mean(weighedAll.filter((b) => b.date >= addDays(lastWeigh.date, -6) && b.date <= lastWeigh.date).map((b) => b.weightKg!)) : undefined
  const profile = [age ? `età ${age}` : '', settings.heightCm ? `altezza ${settings.heightCm} cm` : '', currentAvg ? `peso medio attuale ${fmtNum(currentAvg, 1)} kg` : '']
    .filter(Boolean)
    .join(' · ')
  out.push('## Profilo')
  if (profile) out.push(`- ${profile}`)
  out.push(`- Obiettivo: ${settings.goalText?.trim() || 'non indicato'}`)
  out.push(`- Obiettivo settimanale: ${settings.weeklyRunTarget} corse + ${settings.weeklyGymTarget} palestra`, '')

  // ---- Peso e misure -------------------------------------------------------
  out.push('## Peso e misure')
  const weighed = inRange(weighedAll, from, today)
  if (weighed.length === 0) {
    out.push('Nessuna pesata nel periodo.')
  } else {
    const weeks = new Map<ISODate, number[]>()
    for (const b of weighed) {
      const w = startOfWeek(b.date)
      weeks.set(w, [...(weeks.get(w) ?? []), b.weightKg!])
    }
    out.push('| Settimana | Peso medio | Pesate |', '|---|---|---|')
    for (const [w, xs] of [...weeks.entries()].sort()) out.push(`| ${weekLabel(w)} | ${fmtNum(mean(xs), 1)} kg | ${xs.length} |`)
    const rows = [...weeks.values()]
    if (rows.length >= 2) {
      const delta = mean(rows[rows.length - 1])! - mean(rows[0])!
      out.push(`Variazione nel periodo (media settimanale): ${fmtSigned(delta, 1)} kg.`)
    }
  }
  const circ = CIRCUMFERENCES.map((c) => {
    const all = body.filter((b) => b[c.key] !== undefined)
    const inPeriod = all.filter((b) => b.date >= from && b.date <= today)
    if (inPeriod.length === 0) return ''
    const latest = inPeriod[inPeriod.length - 1][c.key]!
    const before = all.filter((b) => b.date < from)
    const reference = before.length ? before[before.length - 1][c.key]! : inPeriod.length > 1 ? inPeriod[0][c.key]! : undefined
    const delta = reference !== undefined ? ` (${latest === reference ? '=' : fmtSigned(latest - reference, 1)})` : ''
    return `${c.label.toLowerCase()} ${fmtNum(latest, 1)} cm${delta}`
  }).filter(Boolean)
  if (circ.length) out.push(`Circonferenze: ${circ.join(', ')}. Tra parentesi la variazione nel periodo.`)
  out.push('')

  // ---- Corse ---------------------------------------------------------------
  const periodRuns = inRange(runs, from, today)
  const totalKm = periodRuns.reduce((s, r) => s + r.distanceKm, 0)
  const totalSec = periodRuns.reduce((s, r) => s + r.durationSec, 0)
  out.push(`## Corse (${periodRuns.length}${periodRuns.length ? ` · ${fmtNum(totalKm, 1)} km · passo medio ${fmtPace(paceSecPerKm(totalKm, totalSec), true)}` : ''})`)
  if (periodRuns.length === 0) {
    out.push('Nessuna corsa nel periodo.')
  } else {
    out.push('| Data | Km | Tempo | Passo | Tipo | Sens. |', '|---|---|---|---|---|---|')
    for (const r of periodRuns) {
      out.push(`| ${formatDate(r.date, 'short')} | ${fmtNum(r.distanceKm, 2)} | ${fmtDuration(r.durationSec)} | ${fmtPace(paceSecPerKm(r.distanceKm, r.durationSec))} | ${runTypeLabel(r.type).toLowerCase()} | ${r.feeling}/10 |`)
    }
    const prevRuns = inRange(runs, prevFrom, prevTo)
    if (prevRuns.length) {
      const pKm = prevRuns.reduce((s, r) => s + r.distanceKm, 0)
      const pSec = prevRuns.reduce((s, r) => s + r.durationSec, 0)
      out.push(`Periodo precedente: ${prevRuns.length} corse · ${fmtNum(pKm, 1)} km · passo medio ${fmtPace(paceSecPerKm(pKm, pSec), true)}.`)
    }
    const noted = periodRuns.filter((r) => r.notes)
    for (const r of noted) out.push(`- ${formatDate(r.date, 'short')}: ${r.notes}`)
  }
  out.push('')

  // ---- Palestra ------------------------------------------------------------
  const periodGym = inRange(gym, from, today)
  const prevGym = inRange(gym, prevFrom, prevTo)
  out.push(`## Palestra (${periodGym.length} ${periodGym.length === 1 ? 'seduta' : 'sedute'})`)
  if (periodGym.length === 0) {
    out.push('Nessuna seduta nel periodo.')
  } else {
    out.push(`Sedute: ${periodGym.map((s) => formatDate(s.date, 'short')).join(', ')}.`)
    out.push('| Esercizio | Ultima seduta | RIR | vs periodo precedente |', '|---|---|---|---|')
    const ordered = [...exercises].sort((a, b) => a.sortOrder - b.sortOrder)
    for (const ex of ordered) {
      const entries = periodGym.flatMap((s) => s.entries.filter((e) => e.exerciseId === ex.id))
      if (entries.length === 0) continue
      const last = entries[entries.length - 1]
      const valueOf = (e: (typeof entries)[number]) => (ex.mode === 'time' ? e.reps : (e.weightKg ?? 0))
      const unit = ex.mode === 'time' ? 's' : 'kg'
      const maxNow = Math.max(...entries.map(valueOf))
      const prevEntries = prevGym.flatMap((s) => s.entries.filter((e) => e.exerciseId === ex.id))
      let compare = 'nuovo'
      if (prevEntries.length) {
        const maxPrev = Math.max(...prevEntries.map(valueOf))
        compare = maxNow === maxPrev ? `= (${fmtNum(maxPrev, 1)} ${unit})` : `${fmtSigned(maxNow - maxPrev, 1)} ${unit} (da ${fmtNum(maxPrev, 1)})`
      }
      const rir = ex.mode === 'time' || last.rir === undefined ? '–' : String(last.rir)
      const maxNote = maxNow > valueOf(last) ? ` (max ${fmtNum(maxNow, 1)} ${unit})` : ''
      out.push(`| ${ex.name} | ${formatEntry(last, ex)}${maxNote} | ${rir} | ${compare} |`)
    }
    out.push('Confronto sul carico massimo (o sui secondi) del periodo precedente di pari durata.')
    const noted = periodGym.filter((s) => s.notes)
    for (const s of noted) out.push(`- ${formatDate(s.date, 'short')}: ${s.notes}`)
  }
  out.push('')

  // ---- Scheda attuale ------------------------------------------------------
  if (input.plan && input.plan.days.some((d) => d.exercises.length > 0)) {
    const byId = exerciseMap(exercises)
    out.push(`## Scheda attuale (${input.plan.name})`)
    for (const day of input.plan.days) {
      if (day.exercises.length === 0) continue
      out.push(`- **${day.name}**: ${day.exercises.map((pe) => formatPlanExercise(pe, byId.get(pe.exerciseId))).join('; ')}`)
    }
    out.push('')
  }

  // ---- Aderenza ------------------------------------------------------------
  out.push(`## Aderenza (obiettivo ${settings.weeklyRunTarget} corse + ${settings.weeklyGymTarget} palestra a settimana)`)
  out.push('| Settimana | Corse | Palestra |', '|---|---|---|')
  const currentWeek = startOfWeek(today)
  for (let w = startOfWeek(from); w <= currentWeek; w = addDays(w, 7)) {
    const p = weekProgress(runs, gym, settings, w)
    const label = w === currentWeek ? `${weekLabel(w)} (in corso)` : weekLabel(w)
    out.push(`| ${label} | ${p.runs}/${p.runTarget} | ${p.gym}/${p.gymTarget}${p.met ? ' ✓' : ''} |`)
  }
  out.push(`Settimane consecutive a obiettivo: ${goalStreak(runs, gym, settings, today)}.`, '')

  // ---- Note ----------------------------------------------------------------
  out.push('## Note (come mi sento, dolori, sonno, tempo disponibile)')
  out.push(input.notes.trim() || '—')

  return out.join('\n')
}
