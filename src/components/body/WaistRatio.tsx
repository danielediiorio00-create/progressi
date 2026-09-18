import { Link } from 'react-router-dom'
import { WAIST_HEIGHT_REFERENCE } from '../../lib/body'
import { fmtNum } from '../../lib/format'
import { Metric } from '../ui/Metric'
import { Chip } from '../ui/Controls'
import styles from './WaistRatio.module.css'

interface WaistRatioProps {
  ratio?: number
  waistCm?: number
  heightCm?: number
}

const MIN = 0.35
const MAX = 0.65

/**
 * Rapporto vita/altezza con riferimento 0,5: sotto la soglia e' il valore
 * comunemente consigliato. Mostrato come numero + indicatore lineare.
 */
export function WaistRatio({ ratio, waistCm, heightCm }: WaistRatioProps) {
  if (!heightCm) {
    return (
      <div className="stack-sm">
        <span className="label">Vita / altezza</span>
        <p className="muted small">
          Inserisci l'altezza nel <Link viewTransition to="/impostazioni">profilo</Link> per calcolare il rapporto.
        </p>
      </div>
    )
  }
  if (!ratio || !waistCm) {
    return (
      <div className="stack-sm">
        <span className="label">Vita / altezza</span>
        <p className="muted small">Registra la circonferenza vita per calcolare il rapporto.</p>
      </div>
    )
  }

  const pct = ((Math.min(MAX, Math.max(MIN, ratio)) - MIN) / (MAX - MIN)) * 100
  const refPct = ((WAIST_HEIGHT_REFERENCE - MIN) / (MAX - MIN)) * 100
  const below = ratio < WAIST_HEIGHT_REFERENCE

  return (
    <div className="stack-sm">
      <div className="row-between">
        <Metric label="Vita / altezza" value={fmtNum(ratio, 2)} size="sm" />
        <Chip tone={below ? 'good' : 'warn'}>{below ? 'sotto 0,5' : 'sopra 0,5'}</Chip>
      </div>
      <div className={styles.gauge} aria-hidden="true">
        <div className={styles.track} />
        <div className={styles.ref} style={{ left: `${refPct}%` }}>
          <span className={styles.refLabel}>0,5</span>
        </div>
        <div className={styles.dot} style={{ left: `${pct}%` }} />
      </div>
      <p className="muted small">
        {fmtNum(waistCm, 1)} cm di vita su {fmtNum(heightCm, 0)} cm di altezza. Riferimento: restare sotto 0,5.
      </p>
    </div>
  )
}
