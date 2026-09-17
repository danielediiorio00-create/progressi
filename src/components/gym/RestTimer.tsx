import { useEffect, useRef, useState } from 'react'
import { fmtDuration } from '../../lib/format'
import { fmtRest } from '../../lib/plan'
import { ClockIcon } from '../ui/Icons'
import styles from './RestTimer.module.css'

interface RestTimerProps {
  /** Recupero previsto dalla scheda, in secondi. */
  seconds: number
}

/**
 * Timer di recupero tra le serie: un tocco per partire, un altro per fermare.
 * Alla fine vibra (dove supportato) e resta evidenziato finche' non lo tocchi.
 */
export function RestTimer({ seconds }: RestTimerProps) {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (endsAt === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        setEndsAt(null)
        setDone(true)
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {
          /* non supportato */
        }
        return
      }
      raf.current = window.setTimeout(tick, 250)
    }
    tick()
    return () => window.clearTimeout(raf.current)
  }, [endsAt])

  const toggle = () => {
    if (endsAt !== null) {
      setEndsAt(null)
      setRemaining(seconds)
      return
    }
    setDone(false)
    setRemaining(seconds)
    setEndsAt(Date.now() + seconds * 1000)
  }

  const running = endsAt !== null
  return (
    <button
      type="button"
      className={`${styles.timer} ${running ? styles.running : ''} ${done ? styles.done : ''}`}
      onClick={toggle}
      aria-label={running ? 'Ferma il recupero' : 'Avvia il recupero'}
    >
      <ClockIcon size={14} />
      {running ? fmtDuration(remaining) : done ? 'Recupero finito' : `Rec ${fmtRest(seconds)}`}
    </button>
  )
}
