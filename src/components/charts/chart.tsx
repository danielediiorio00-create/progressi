import type { ReactNode } from 'react'
import { formatDate, toISO } from '../../lib/date'
import styles from './chart.module.css'

/**
 * Impostazioni condivise da tutti i grafici, cosi' si somigliano:
 * griglia recessiva, assi senza linee, testo nei colori del tema
 * (mai nel colore della serie), linee 2px, marker >= 8px.
 */

export const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 11 } as const
export const LINE_WIDTH = 2
export const MARKER_R = 4
export const ACTIVE_DOT = { r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 } as const
export const CURSOR = { stroke: 'var(--text-subtle)', strokeWidth: 1 } as const
export const CHART_MARGIN = { top: 10, right: 8, left: 0, bottom: 0 } as const
export const DAY_MS = 86_400_000

/** Etichetta breve per un timestamp sull'asse X ("17 set"). */
export function tickDate(t: number): string {
  return formatDate(toISO(new Date(t)), 'short')
}

/** Dominio temporale con un po' d'aria ai lati (e sensato anche con un solo punto). */
export function timeDomain(ts: number[]): [number, number] {
  if (ts.length === 0) return [0, 1]
  const min = Math.min(...ts)
  const max = Math.max(...ts)
  const pad = Math.max(DAY_MS, (max - min) * 0.04)
  return [min - pad, max + pad]
}

export interface NiceScale {
  domain: [number, number]
  ticks: number[]
}

/**
 * Asse dei valori con numeri "tondi" (80, 82, 84...) e un po' d'aria ai bordi.
 * Recharts, con un dominio esplicito, non arrotonda da solo i tick.
 */
export function niceScale(values: number[], tickCount = 4, minStep = 0, options: { steps?: number[]; fromZero?: boolean } = {}): NiceScale {
  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] }
  const dataMin = options.fromZero ? 0 : Math.min(...values)
  const dataMax = Math.max(...values)
  const raw = Math.max((dataMax - dataMin) / Math.max(1, tickCount - 1), minStep, 1e-6)
  let step: number
  if (options.steps) {
    // Passi fissi (es. secondi: 15, 30, 60...) per grandezze non decimali.
    step = options.steps.find((s) => s >= raw) ?? options.steps[options.steps.length - 1]
  } else {
    const magnitude = 10 ** Math.floor(Math.log10(raw))
    step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude
  }
  let min = Math.floor(dataMin / step) * step
  let max = Math.ceil(dataMax / step) * step
  if (!options.fromZero && dataMin - min < step * 0.25) min -= step
  if (max - dataMax < step * 0.25) max += step
  const ticks: number[] = []
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(6)))
  return { domain: [min, max], ticks }
}

/** Passi sensati per assi in secondi (passo, durata). */
export const TIME_STEPS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]

interface TooltipCardProps {
  title: string
  rows: { label: string; value: ReactNode; accent?: boolean }[]
}

/** Contenuto del tooltip: piccola card con titolo e righe etichetta/valore. */
export function TooltipCard({ title, rows }: TooltipCardProps) {
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{title}</p>
      {rows.map((r) => (
        <p key={r.label} className={styles.tooltipRow}>
          {r.accent && <span className={styles.swatch} aria-hidden="true" />}
          <span className={styles.tooltipLabel}>{r.label}</span>
          <span className="tnum">{r.value}</span>
        </p>
      ))}
    </div>
  )
}

/** Contenitore con altezza fissa: i grafici usano la prop `responsive` di Recharts. */
export function ChartBox({ height = 200, children }: { height?: number; children: ReactNode }) {
  return (
    <div className={styles.box} style={{ height }}>
      {children}
    </div>
  )
}
