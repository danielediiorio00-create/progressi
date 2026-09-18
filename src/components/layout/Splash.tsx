import { useState } from 'react'
import styles from './Splash.module.css'

/**
 * Schermata di apertura: il sole sorge sullo sfondo sabbia, compare il nome,
 * poi tutto si dissolve sulla Home. Dura circa 1,2 s e si vede solo
 * all'avvio (non cambiando pagina). Con "riduci movimento" attivo non compare.
 */
export function Splash() {
  const [visible, setVisible] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  if (!visible) return null
  return (
    <div className={styles.splash} aria-hidden="true" onAnimationEnd={(e) => e.animationName === styles.fadeOut && setVisible(false)}>
      <div className={styles.sun} />
      <p className={styles.name}>Progressi</p>
    </div>
  )
}
