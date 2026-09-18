import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon } from './Icons'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  /** Riga piccola sopra al titolo (es. la data di oggi). */
  eyebrow?: string
  subtitle?: string
  /** Azioni a destra (icone, pulsanti). */
  actions?: ReactNode
  /** Se presente, mostra la freccia "indietro" verso questo percorso. */
  backTo?: string
}

/** Intestazione di pagina: titolo in peso light, molto spazio attorno. */
export function PageHeader({ title, eyebrow, subtitle, actions, backTo }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {backTo && (
          <Link viewTransition to={backTo} className={styles.back} aria-label="Indietro">
            <ChevronLeftIcon size={20} />
          </Link>
        )}
        {eyebrow && <p className="label">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}

/** Bottone circolare di intestazione (es. ingranaggio delle impostazioni). */
export function HeaderButton({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <Link viewTransition to={to} className={styles.headerBtn} aria-label={label} title={label}>
      {children}
    </Link>
  )
}
