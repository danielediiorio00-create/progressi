import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRightIcon } from './Icons'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Occupa tutta la larghezza disponibile. */
  full?: boolean
  icon?: ReactNode
  children?: ReactNode
}

/** Pulsante a pillola. "primary" e' la pillola nera del design. */
export function Button({ variant = 'primary', size = 'md', full = false, icon, className = '', children, ...rest }: ButtonProps) {
  const cls = [styles.btn, styles[variant], styles[size], full ? styles.full : '', className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Testo per lo screen reader (il bottone mostra solo un'icona). */
  label: string
  children: ReactNode
}

/** Bottone circolare con una sola icona (es. la freccia accanto alla pillola). */
export function IconButton({ variant = 'primary', size = 'md', label, className = '', children, ...rest }: IconButtonProps) {
  const cls = [styles.iconBtn, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}

interface ActionPairProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  /** Icona del bottone circolare (predefinita: freccia). */
  icon?: ReactNode
}

/** Pillola nera + bottone circolare con freccia: l'azione principale del design. */
export function ActionPair({ label, onClick, disabled, type = 'button', icon }: ActionPairProps) {
  return (
    <div className={styles.pair}>
      <button type={type} className={`${styles.btn} ${styles.primary} ${styles.md} ${styles.full}`} onClick={onClick} disabled={disabled}>
        {label}
      </button>
      <button type={type} className={`${styles.iconBtn} ${styles.primary} ${styles.md}`} onClick={onClick} disabled={disabled} aria-label={label} tabIndex={-1}>
        {icon ?? <ArrowRightIcon />}
      </button>
    </div>
  )
}
