import type { ReactNode } from 'react'
import { MinusIcon, PlusIcon } from './Icons'
import styles from './Controls.module.css'

/* ---------- Segmented: scelta tra poche opzioni (es. Auto / Chiaro / Scuro) ---------- */

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`${styles.segment} ${o.value === value ? styles.segmentActive : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Stepper: numero con − e + (es. obiettivo settimanale) ---------- */

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  /** Testo che accompagna il numero, es. "corse". */
  unit?: string
}

export function Stepper({ value, onChange, min = 0, max = 99, step = 1, label, unit }: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  return (
    <div className={styles.stepper}>
      <span className={styles.stepperLabel}>{label}</span>
      <div className={styles.stepperControls}>
        <button type="button" className={styles.stepBtn} onClick={dec} disabled={value <= min} aria-label={`Diminuisci ${label}`}>
          <MinusIcon size={18} />
        </button>
        <span className={`${styles.stepValue} tnum`}>
          {value}
          {unit && <span className={styles.stepUnit}> {unit}</span>}
        </span>
        <button type="button" className={styles.stepBtn} onClick={inc} disabled={value >= max} aria-label={`Aumenta ${label}`}>
          <PlusIcon size={18} />
        </button>
      </div>
    </div>
  )
}

/* ---------- Chip: etichetta a pillola (stato, tipo, tag) ---------- */

interface ChipProps {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'good' | 'bad' | 'warn'
  className?: string
}

export function Chip({ children, tone = 'neutral', className = '' }: ChipProps) {
  return <span className={`${styles.chip} ${styles[`chip_${tone}`]} ${className}`}>{children}</span>
}
