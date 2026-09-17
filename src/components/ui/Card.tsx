import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

type Variant = 'solid' | 'glass' | 'dark'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  /** Riduce il padding interno (per liste e righe compatte). */
  compact?: boolean
  children: ReactNode
}

/**
 * Card con angoli molto arrotondati e ombra morbida.
 * - solid: bianca pulita (predefinita)
 * - glass: vetro smerigliato traslucido
 * - dark:  scura con testo bianco, per l'elemento in evidenza
 */
export function Card({ variant = 'solid', compact = false, className = '', children, ...rest }: CardProps) {
  const cls = [styles.card, styles[variant], compact ? styles.compact : '', className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
