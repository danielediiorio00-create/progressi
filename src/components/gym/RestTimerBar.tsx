import type { RestTimer } from '../../hooks/useRestTimer'
import { useWakeLock } from '../../hooks/useWakeLock'
import { fmtDuration } from '../../lib/format'
import { ClockIcon, CloseIcon, MinusIcon, PlusIcon, RepeatIcon, SunIcon } from '../ui/Icons'
import styles from './RestTimerBar.module.css'

const PRESETS = [60, 90, 120, 180]

/**
 * Barra del recupero, fissa in fondo al modulo seduta: avvio rapido con i
 * tempi tipici, conto alla rovescia grande con +/-15 s e stop, avviso a fine
 * recupero. Il tasto "sole" tiene lo schermo acceso durante l'allenamento.
 */
export function RestTimerBar({ timer }: { timer: RestTimer }) {
  const wake = useWakeLock()
  const progress = timer.total > 0 ? Math.min(100, ((timer.total - timer.remaining) / timer.total) * 100) : 0

  const wakeButton = wake.supported ? (
    <button
      type="button"
      className={`${styles.round} ${wake.active ? styles.roundActive : ''}`}
      onClick={wake.toggle}
      aria-pressed={wake.active}
      aria-label={wake.active ? 'Lascia spegnere lo schermo' : 'Tieni lo schermo acceso'}
      title={wake.active ? 'Schermo sempre acceso: attivo' : 'Tieni lo schermo acceso'}
    >
      <SunIcon size={18} />
    </button>
  ) : null

  if (timer.done) {
    return (
      <div className={`${styles.bar} ${styles.done}`} role="status" aria-live="assertive">
        <div className={styles.doneText}>
          <strong>Recupero finito</strong>
          {timer.label && <span>{timer.label} · prossima serie</span>}
        </div>
        <button type="button" className={styles.round} onClick={() => timer.start(timer.total, timer.label)} aria-label="Ripeti il recupero">
          <RepeatIcon size={18} />
        </button>
        <button type="button" className={styles.round} onClick={timer.dismiss} aria-label="Chiudi">
          <CloseIcon size={18} />
        </button>
      </div>
    )
  }

  if (timer.running) {
    return (
      <div className={`${styles.bar} ${styles.running}`} role="timer" aria-live="off">
        <div className={styles.track} aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.row}>
          <div className={styles.countdown}>
            <span className={styles.time}>{fmtDuration(timer.remaining)}</span>
            <span className={styles.label}>{timer.label ? `recupero · ${timer.label}` : 'recupero'}</span>
          </div>
          <button type="button" className={styles.round} onClick={() => timer.adjust(-15)} aria-label="Togli 15 secondi">
            <MinusIcon size={16} />
            <span className={styles.roundText}>15</span>
          </button>
          <button type="button" className={styles.round} onClick={() => timer.adjust(15)} aria-label="Aggiungi 15 secondi">
            <PlusIcon size={16} />
            <span className={styles.roundText}>15</span>
          </button>
          <button type="button" className={`${styles.round} ${styles.stop}`} onClick={timer.stop} aria-label="Ferma il timer">
            <CloseIcon size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        <span className={styles.idleLabel}>
          <ClockIcon size={16} /> Recupero
        </span>
        <div className={styles.presets}>
          {PRESETS.map((s) => (
            <button key={s} type="button" className={styles.preset} onClick={() => timer.start(s)}>
              {s >= 120 ? `${s / 60} min` : `${s} s`}
            </button>
          ))}
        </div>
        {wakeButton}
      </div>
    </div>
  )
}
