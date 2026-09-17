import type { BodyEntry, ISODate } from '../db/types'
import { addDays, parseISO } from './date'

/** Campi numerici delle circonferenze, con etichetta per l'interfaccia. */
export const CIRCUMFERENCES = [
  { key: 'waistCm', label: 'Vita', short: 'V' },
  { key: 'hipsCm', label: 'Fianchi', short: 'F' },
  { key: 'thighCm', label: 'Coscia', short: 'C' },
  { key: 'armCm', label: 'Braccio', short: 'B' },
] as const

export type CircumferenceKey = (typeof CIRCUMFERENCES)[number]['key']

/** Soglia di riferimento del rapporto vita/altezza. */
export const WAIST_HEIGHT_REFERENCE = 0.5

export function sortByDate<T extends { date: ISODate }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a as { id?: number }).id! - (b as { id?: number }).id!))
}

function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Media dei pesi registrati nell'intervallo [from, to] (estremi inclusi). */
function meanWeightBetween(entries: BodyEntry[], from: ISODate, to: ISODate): number | undefined {
  return mean(entries.filter((e) => e.weightKg !== undefined && e.date >= from && e.date <= to).map((e) => e.weightKg!))
}

export interface WeightPoint {
  /** Timestamp (ms) per l'asse temporale del grafico. */
  t: number
  date: ISODate
  weight: number
  /** Media mobile dei 7 giorni che terminano in questa data. */
  avg7: number
}

/**
 * Serie del peso con media mobile settimanale. Il singolo valore oscilla
 * per acqua, cibo e orario: la media a 7 giorni e' quella che conta.
 */
export function weightPoints(entries: BodyEntry[]): WeightPoint[] {
  const weighed = sortByDate(entries.filter((e) => e.weightKg !== undefined))
  return weighed.map((e) => ({
    t: parseISO(e.date).getTime(),
    date: e.date,
    weight: e.weightKg!,
    avg7: meanWeightBetween(weighed, addDays(e.date, -6), e.date)!,
  }))
}

export interface WeightSummary {
  count: number
  latest?: number
  latestDate?: ISODate
  /** Media degli ultimi 7 giorni (fino all'ultima pesata). */
  avg7?: number
  /** Media dei 7 giorni precedenti. */
  prevAvg7?: number
  /** Differenza tra le due medie settimanali. */
  deltaWeek?: number
  /** Media della prima settimana di rilevazioni. */
  firstAvg7?: number
  /** Differenza tra la media attuale e quella iniziale. */
  deltaStart?: number
}

export function weightSummary(entries: BodyEntry[]): WeightSummary {
  const weighed = sortByDate(entries.filter((e) => e.weightKg !== undefined))
  if (weighed.length === 0) return { count: 0 }
  const last = weighed[weighed.length - 1]
  const first = weighed[0]
  const avg7 = meanWeightBetween(weighed, addDays(last.date, -6), last.date)
  const prevAvg7 = meanWeightBetween(weighed, addDays(last.date, -13), addDays(last.date, -7))
  const firstAvg7 = meanWeightBetween(weighed, first.date, addDays(first.date, 6))
  // Confronto con l'inizio solo se e' passata almeno una settimana.
  const hasHistory = last.date > addDays(first.date, 6)
  return {
    count: weighed.length,
    latest: last.weightKg,
    latestDate: last.date,
    avg7,
    prevAvg7,
    deltaWeek: avg7 !== undefined && prevAvg7 !== undefined ? avg7 - prevAvg7 : undefined,
    firstAvg7,
    deltaStart: hasHistory && avg7 !== undefined && firstAvg7 !== undefined ? avg7 - firstAvg7 : undefined,
  }
}

export interface MeasureSummary {
  latest?: number
  latestDate?: ISODate
  first?: number
  /** Variazione dalla prima rilevazione (solo se ce ne sono almeno due). */
  delta?: number
}

/** Ultimo valore e variazione dall'inizio per una circonferenza. */
export function measureSummary(entries: BodyEntry[], key: CircumferenceKey): MeasureSummary {
  const measured = sortByDate(entries.filter((e) => e[key] !== undefined))
  if (measured.length === 0) return {}
  const first = measured[0][key]!
  const last = measured[measured.length - 1]
  return {
    latest: last[key],
    latestDate: last.date,
    first,
    delta: measured.length > 1 ? last[key]! - first : undefined,
  }
}

/** Rapporto vita/altezza (entrambi in cm). */
export function waistToHeight(waistCm: number | undefined, heightCm: number | undefined): number | undefined {
  if (!waistCm || !heightCm) return undefined
  return waistCm / heightCm
}
