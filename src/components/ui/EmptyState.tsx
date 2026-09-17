import type { ReactNode } from 'react'
import { Sun } from './Sun'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  text?: string
  action?: ReactNode
}

/** Messaggio mostrato quando una sezione non ha ancora dati. */
export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Sun size={56} className={styles.sun} />
      <h2 className={styles.title}>{title}</h2>
      {text && <p className={styles.text}>{text}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
