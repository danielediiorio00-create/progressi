import type { CSSProperties } from 'react'
import styles from './Sun.module.css'

interface SunProps {
  /** Diametro in px. */
  size?: number
  /** Posizione assoluta dentro il contenitore (che deve avere position: relative). */
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  /** Bagliore morbido attorno al sole. */
  glow?: boolean
  className?: string
}

/** Forma decorativa "sole": cerchio con gradiente radiale arancione. */
export function Sun({ size = 120, top, right, bottom, left, glow = true, className = '' }: SunProps) {
  const style: CSSProperties = { width: size, height: size, top, right, bottom, left }
  return <span aria-hidden="true" className={`${styles.sun} ${glow ? styles.glow : ''} ${className}`} style={style} />
}
