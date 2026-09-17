import type { ISODate } from '../db/types'

/**
 * Tutte le date "giorno" sono stringhe ISO "YYYY-MM-DD" nel fuso locale.
 * Si evita `new Date("2026-09-17")` perche' JavaScript lo interpreta
 * come UTC e a mezzanotte in Italia si finirebbe nel giorno prima.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

/** Giorni interi tra due date (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000)
}

/** Lunedi' della settimana che contiene la data. */
export function startOfWeek(iso: ISODate): ISODate {
  const d = parseISO(iso)
  const offset = (d.getDay() + 6) % 7 // lunedi' = 0 ... domenica = 6
  d.setDate(d.getDate() - offset)
  return toISO(d)
}

export function endOfWeek(iso: ISODate): ISODate {
  return addDays(startOfWeek(iso), 6)
}

export function isSameDay(a: ISODate, b: ISODate): boolean {
  return a === b
}

const fmtShort = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const fmtMedium = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtNumeric = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtDateTime = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export type DateStyle = 'short' | 'medium' | 'long' | 'numeric'

/** "17 set", "mer 17 set", "mercoledi' 17 settembre", "17/09/2026". */
export function formatDate(iso: ISODate, style: DateStyle = 'medium'): string {
  const d = parseISO(iso)
  switch (style) {
    case 'short':
      return fmtShort.format(d)
    case 'long':
      return fmtLong.format(d)
    case 'numeric':
      return fmtNumeric.format(d)
    default:
      return fmtMedium.format(d)
  }
}

/** Da una data/ora ISO completa (es. lastBackupAt) a "17 set, 21:30". */
export function formatDateTime(isoDateTime: string): string {
  return fmtDateTime.format(new Date(isoDateTime))
}

/** "Oggi", "Ieri" oppure la data. */
export function formatRelativeDay(iso: ISODate): string {
  const diff = daysBetween(iso, todayISO())
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Ieri'
  return formatDate(iso, 'medium')
}
