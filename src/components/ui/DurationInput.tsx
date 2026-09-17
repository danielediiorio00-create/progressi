import styles from './DurationInput.module.css'

interface DurationInputProps {
  minutes: string
  seconds: string
  onChange: (minutes: string, seconds: string) => void
  autoFocus?: boolean
}

/**
 * Durata come "minuti : secondi" in due campi affiancati: la tastiera
 * numerica di iPhone non ha i due punti, cosi' si inserisce senza pensarci.
 */
export function DurationInput({ minutes, seconds, onChange, autoFocus }: DurationInputProps) {
  const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max)
  return (
    <span className={styles.wrap}>
      <input
        className={styles.input}
        type="text"
        inputMode="numeric"
        placeholder="mm"
        value={minutes}
        onChange={(e) => onChange(digits(e.target.value, 3), seconds)}
        autoFocus={autoFocus}
        aria-label="Minuti"
      />
      <span className={styles.colon}>:</span>
      <input
        className={styles.input}
        type="text"
        inputMode="numeric"
        placeholder="ss"
        value={seconds}
        onChange={(e) => onChange(minutes, digits(e.target.value, 2))}
        aria-label="Secondi"
      />
    </span>
  )
}

/** Da (minuti, secondi) a secondi totali; null se incompleto o non valido. */
export function durationFromParts(minutes: string, seconds: string): number | null {
  if (minutes.trim() === '' && seconds.trim() === '') return null
  const m = Number(minutes || '0')
  const s = Number(seconds || '0')
  if (!Number.isInteger(m) || !Number.isInteger(s) || s >= 60 || m < 0 || s < 0) return null
  const total = m * 60 + s
  return total > 0 ? total : null
}

/** Da secondi totali a (minuti, secondi) come stringhe per il modulo. */
export function partsFromDuration(totalSec: number | undefined): [string, string] {
  if (!totalSec) return ['', '']
  return [String(Math.floor(totalSec / 60)), String(totalSec % 60).padStart(2, '0')]
}
