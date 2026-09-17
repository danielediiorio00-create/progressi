import { useToasts } from '../../hooks/useToast'
import styles from './Toaster.module.css'

/** Mostra le notifiche brevi create con toast(). Va messo una volta nel layout. */
export function Toaster() {
  const toasts = useToasts()
  if (toasts.length === 0) return null
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
