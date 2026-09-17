import type { ReactNode } from 'react'
import styles from './Metric.module.css'

interface MetricProps {
  /** Valore gia' formattato (es. "72,4"). */
  value: ReactNode
  unit?: string
  label: string
  /** "hero" e' il numero gigante della dashboard, "sm" per griglie compatte. */
  size?: 'hero' | 'lg' | 'sm'
  /** Testo sotto al numero, es. "−0,8 kg dall'inizio". */
  delta?: ReactNode
  deltaTone?: 'neutral' | 'good' | 'bad'
  align?: 'left' | 'center'
  className?: string
}

/** Numero grande + etichetta piccola: la gerarchia visiva del design. */
export function Metric({ value, unit, label, size = 'lg', delta, deltaTone = 'neutral', align = 'left', className = '' }: MetricProps) {
  return (
    <div className={`${styles.metric} ${styles[size]} ${align === 'center' ? styles.center : ''} ${className}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      {delta && <span className={`${styles.delta} ${styles[deltaTone]}`}>{delta}</span>}
    </div>
  )
}
