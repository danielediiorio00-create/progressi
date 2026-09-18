import { useEffect, useState } from 'react'
import styles from './Splash.module.css'

/** Dopo quanti secondi in background la riapertura mostra di nuovo l'animazione. */
const REOPEN_AFTER_MS = 20_000
/** Durata complessiva (animazioni + dissolvenza); dopo, il componente si smonta comunque. */
const TOTAL_MS = 1600

/**
 * Schermata di apertura: il sole sorge sullo sfondo sabbia, compare il nome,
 * poi tutto si dissolve sulla Home. Compare all'avvio e quando l'app torna
 * in primo piano dopo un po' (iOS tiene le app aperte in memoria: toccare
 * l'icona non ricarica la pagina). Con "riduci movimento" resta solo la
 * dissolvenza.
 */
export function Splash() {
  // "run" cambia a ogni apertura: forza il riavvio delle animazioni.
  const [run, setRun] = useState(1)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let hiddenAt: number | null = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= REOPEN_AFTER_MS) {
        setRun((r) => r + 1)
        setVisible(true)
      }
      hiddenAt = null
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Rete di sicurezza: si smonta anche se l'evento di fine animazione non arriva.
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => setVisible(false), TOTAL_MS)
    return () => window.clearTimeout(id)
  }, [visible, run])

  if (!visible) return null
  return (
    <div key={run} className={styles.splash} aria-hidden="true" onAnimationEnd={(e) => e.animationName === styles.fadeOut && setVisible(false)}>
      <div className={styles.sun} />
      <p className={styles.name}>Progressi</p>
    </div>
  )
}
