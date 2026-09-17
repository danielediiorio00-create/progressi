import type { ReactNode } from 'react'
import { ChevronRightIcon } from './Icons'
import styles from './ListRow.module.css'

/** Elenco di righe toccabili (usato dentro una Card compatta). */
export function List({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="stack-sm">
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul className={styles.list}>{children}</ul>
    </div>
  )
}

interface ListRowProps {
  title: ReactNode
  /** Riga piccola sotto al titolo. */
  meta?: ReactNode
  /** Valore grande a destra (es. "5,2"). */
  value?: ReactNode
  unit?: string
  /** Contenuto extra NON interattivo a destra (es. un chip). */
  aside?: ReactNode
  /** Pulsanti propri della riga (es. frecce): stanno fuori dall'area toccabile. */
  actions?: ReactNode
  onClick?: () => void
}

export function ListRow({ title, meta, value, unit, aside, actions, onClick }: ListRowProps) {
  const body = (
    <>
      <div className={styles.main}>
        <span className={styles.rowTitle}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {aside}
      {value !== undefined && (
        <span className={`${styles.value} tnum`}>
          {value}
          {unit && <span className={styles.unit}> {unit}</span>}
        </span>
      )}
      {onClick && !actions && <ChevronRightIcon size={18} className={styles.chevron} />}
    </>
  )
  return (
    <li className={styles.item}>
      {onClick ? (
        <button type="button" className={styles.row} onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className={styles.row}>{body}</div>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </li>
  )
}
