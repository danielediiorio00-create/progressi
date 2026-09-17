import type { Exercise, GymEntry, GymSession, Plan, PlanDay, PlanExercise } from '../db/types'
import { fmtNum } from './format'
import { lastEntryFor, type ExerciseMap } from './gym'

/* =========================================================================
   Scheda di allenamento: lettura/scrittura in Markdown e funzioni di supporto.
   ========================================================================= */

export interface ParsedExercise {
  name: string
  sets: number
  reps: number
  /** True se "reps" sono secondi (plank, tenute). */
  time: boolean
  weightKg?: number
  rir?: number
  restSec?: number
}

export interface ParsedDay {
  name: string
  exercises: ParsedExercise[]
}

export interface ParsedPlan {
  name?: string
  days: ParsedDay[]
  warnings: string[]
}

const LIST_MARK = /^\s*(?:[-*•]|\d+[.)])\s+/
const SETS_REPS = /(\d+)\s*(?:[x×X*]|serie\s+(?:da|x|×|di))\s*(\d+)(?:\s*(s\b|sec\b|secondi\b|"|''))?/i
const WEIGHT = /(\d+(?:[.,]\d+)?)\s*kg/i
const RIR = /\brir\s*:?\s*(\d+)/i
// "rec 90 s", "recupero 2 min", "rest 1'30''", "riposo 60" (dopo la parola chiave)...
const REST_AFTER = /\b(?:rec(?:upero)?|rest|riposo|pausa)\s*:?\s*(\d+)\s*(min\b|m\b|'|s\b|sec\b|''|")?\s*(?:(\d+)\s*(?:''|"|s\b|sec\b))?/i
// ...oppure "90 s di recupero", "2 min rec" (prima della parola chiave).
const REST_BEFORE = /(\d+)\s*(min\b|m\b|'|s\b|sec\b|''|")?\s*(?:di\s+)?(?:rec(?:upero)?|rest|riposo|pausa)\b/i
const TIME_WORDS = /plank|tenuta|isometr|hold|wall sit/i
const DAY_WORDS = /^(giorno|day|allenamento|sessione|workout|scheda\s+[a-z0-9])/i

/** Normalizza per confrontare nomi: minuscolo, senza accenti e spazi doppi. */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Secondi di recupero da "90 s", "2 min", "1'30''"; senza unita': <= 10 sono minuti. */
function restSeconds(n: string, unit: string | undefined, extra: string | undefined): number {
  const v = Number(n)
  const isMin = unit ? /^(min|m|')$/i.test(unit) : v <= 10
  return Math.min(1800, isMin ? v * 60 + Number(extra ?? 0) : v)
}

function parseRest(line: string): { restSec: number; match: string } | undefined {
  const a = REST_AFTER.exec(line)
  if (a) return { restSec: restSeconds(a[1], a[2], a[3]), match: a[0] }
  const b = REST_BEFORE.exec(line)
  if (b) return { restSec: restSeconds(b[1], b[2], undefined), match: b[0] }
  return undefined
}

function parseExerciseLine(text: string): ParsedExercise | undefined {
  let line = text.trim()
  if (!line) return undefined
  const rest = parseRest(line)
  if (rest) line = line.replace(rest.match, ' ')
  const weight = WEIGHT.exec(line)
  const rir = RIR.exec(line)
  // Tolgo carico e RIR prima di leggere il nome, cosi' "Leg press 60 kg 3x12" funziona.
  const stripped = line.replace(WEIGHT, ' ').replace(RIR, ' ')
  const m = SETS_REPS.exec(stripped)
  let name: string
  let sets = 3
  let reps = 10
  let time = false
  if (m) {
    name = stripped.slice(0, m.index)
    sets = Number(m[1])
    reps = Number(m[2])
    time = Boolean(m[3])
  } else {
    // Nessun "3x12": il nome e' quello che resta senza carico e RIR.
    name = stripped
  }
  name = name.replace(/[\s\-–—:·,@|]+$/g, '').replace(/^[\s\-–—:·,|]+/g, '').trim()
  if (!name) return undefined
  if (TIME_WORDS.test(name)) time = true
  return {
    name,
    sets: Math.min(30, Math.max(1, sets)),
    reps: Math.min(999, Math.max(1, reps)),
    time,
    weightKg: weight ? Number(weight[1].replace(',', '.')) : undefined,
    rir: rir ? Number(rir[1]) : undefined,
    restSec: rest?.restSec,
  }
}

/**
 * Legge una scheda scritta in Markdown (o testo semplice). Regole tolleranti:
 * - "# Titolo" e' il nome della scheda; "## Giorno A" (o una riga che finisce
 *   con ":" / inizia con "Giorno") apre un giorno;
 * - ogni riga di elenco o di tabella e' un esercizio: "Leg press 3x12 60 kg RIR 2",
 *   "Plank 3x45 s", "Goblet squat 3 serie da 10 @ 16 kg".
 */
export function parsePlanMarkdown(text: string): ParsedPlan {
  const out: ParsedPlan = { days: [], warnings: [] }
  let current: ParsedDay | undefined
  const ensureDay = () => {
    if (!current) {
      current = { name: `Giorno ${String.fromCharCode(65 + out.days.length)}`, exercises: [] }
      out.days.push(current)
    }
    return current
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (/^\|?\s*:?-{2,}/.test(line)) continue // separatore di tabella |---|
    const h1 = /^#\s+(.+)$/.exec(line)
    if (h1 && out.days.length === 0 && !current) {
      out.name = h1[1].trim()
      continue
    }
    const heading = /^#{1,6}\s+(.+)$/.exec(line) ?? /^\*\*(.+?)\*\*:?$/.exec(line)
    const dayLine = heading?.[1] ?? (DAY_WORDS.test(line) && !SETS_REPS.test(line) ? line : /^[^|\-*•\d].*:$/.test(line) ? line.slice(0, -1) : undefined)
    if (dayLine !== undefined) {
      current = { name: dayLine.replace(/[:*]+$/g, '').trim() || `Giorno ${String.fromCharCode(65 + out.days.length)}`, exercises: [] }
      out.days.push(current)
      continue
    }
    let body = line
    if (line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
      if (cells.some((c) => /^(esercizio|serie|rip|ripetizioni|carico|kg|rir)$/i.test(c))) continue // intestazione
      // Tabella "| Esercizio | Serie | Rip | Carico |": ricompongo "nome 3x12 resto".
      body =
        cells.length >= 3 && /^\d+$/.test(cells[1]) && /^\d+\s*(s|sec|secondi)?$/i.test(cells[2])
          ? `${cells[0]} ${cells[1]}x${cells[2]} ${cells.slice(3).join(' ')}`
          : cells.join(' ')
    } else if (LIST_MARK.test(line)) {
      body = line.replace(LIST_MARK, '')
    } else if (!SETS_REPS.test(line)) {
      continue // testo libero: ignorato
    }
    const ex = parseExerciseLine(body)
    if (!ex) continue
    if (!SETS_REPS.test(body)) out.warnings.push(`"${ex.name}": serie e ripetizioni non trovate, uso 3×10.`)
    ensureDay().exercises.push(ex)
  }
  out.days = out.days.filter((d) => d.exercises.length > 0)
  if (out.days.length === 0) out.warnings.push('Nessun esercizio riconosciuto. Scrivi una riga per esercizio, es. "- Leg press 3x12 60 kg".')
  return out
}

/** Trova l'esercizio esistente con lo stesso nome (o molto simile). */
export function matchExercise(name: string, exercises: Exercise[]): Exercise | undefined {
  const n = normalizeName(name)
  if (!n) return undefined
  const exact = exercises.find((e) => normalizeName(e.name) === n)
  if (exact) return exact
  if (n.length < 4) return undefined
  return exercises.find((e) => {
    const en = normalizeName(e.name)
    return en.length >= 4 && (en.includes(n) || n.includes(en))
  })
}

/** Scheda in Markdown: lo stesso formato che l'importazione sa rileggere. */
export function planToMarkdown(plan: Plan, exercises: ExerciseMap): string {
  const lines: string[] = [`# ${plan.name}`, '']
  for (const day of plan.days) {
    lines.push(`## ${day.name}`)
    for (const pe of day.exercises) lines.push(`- ${formatPlanExercise(pe, exercises.get(pe.exerciseId))}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

/** 90 -> "90 s", 120 -> "2 min", 150 -> "2 min 30 s". */
export function fmtRest(sec: number): string {
  if (sec < 120 || sec % 30 !== 0) return `${sec} s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m} min ${s} s` : `${m} min`
}

/** "Leg press 3×12 · 60 kg · RIR 2 · rec 90 s" oppure "Plank a tempo 3×45 s". */
export function formatPlanExercise(pe: PlanExercise, exercise: Exercise | undefined, withName = true): string {
  const time = exercise?.mode === 'time'
  const parts = [`${pe.sets}×${pe.reps}${time ? ' s' : ''}`]
  if (pe.weightKg) parts.push(`${fmtNum(pe.weightKg, 1)} kg`)
  if (pe.rir !== undefined && !time) parts.push(`RIR ${pe.rir}`)
  if (pe.restSec) parts.push(`rec ${fmtRest(pe.restSec)}`)
  if (pe.note) parts.push(pe.note)
  return `${withName ? `${exercise?.name ?? 'Esercizio'} ` : ''}${parts.join(' · ')}`
}

/**
 * Voci di seduta a partire da un giorno della scheda: serie e ripetizioni
 * dalla scheda, carico dall'ultima volta che l'esercizio e' stato fatto
 * (se c'e'), altrimenti dal carico di riferimento della scheda.
 */
export function entriesFromPlanDay(day: PlanDay, sessions: GymSession[]): GymEntry[] {
  return day.exercises.map((pe) => {
    const last = lastEntryFor(sessions, pe.exerciseId)?.entry
    return {
      exerciseId: pe.exerciseId,
      sets: pe.sets,
      reps: pe.reps,
      weightKg: last?.weightKg ?? pe.weightKg,
      rir: last?.rir ?? pe.rir,
    }
  })
}

/** Nuova copia della scheda con i carichi aggiornati agli ultimi usati nelle sedute. */
export function syncPlanLoads(plan: Plan, sessions: GymSession[], exercises: ExerciseMap): { plan: Plan; changed: number } {
  let changed = 0
  const days = plan.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((pe) => {
      const last = lastEntryFor(sessions, pe.exerciseId)?.entry
      if (!last) return pe
      const time = exercises.get(pe.exerciseId)?.mode === 'time'
      const next: PlanExercise = time ? { ...pe, reps: last.reps } : { ...pe, weightKg: last.weightKg ?? pe.weightKg, rir: last.rir ?? pe.rir }
      if (next.weightKg !== pe.weightKg || next.reps !== pe.reps || next.rir !== pe.rir) changed++
      return next
    }),
  }))
  return { plan: { ...plan, days, updatedAt: new Date().toISOString() }, changed }
}

/** Il giorno che viene dopo quello dell'ultima seduta (a rotazione). */
export function suggestNextDay(plan: Plan, sessions: GymSession[]): PlanDay | undefined {
  if (plan.days.length === 0) return undefined
  const withDay = [...sessions].filter((s) => s.planDay).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id ?? 0) - (a.id ?? 0)))
  const lastName = withDay[0]?.planDay
  const i = plan.days.findIndex((d) => d.name === lastName)
  return plan.days[(i + 1) % plan.days.length]
}
