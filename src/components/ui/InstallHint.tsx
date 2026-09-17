import { useState } from 'react'
import { Card } from './Card'
import { Chip } from '../ui/Controls'
import { CloseIcon, ShareIcon } from './Icons'
import styles from './InstallHint.module.css'

const KEY = 'progressi.installHintDismissed'

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false
  } catch {
    /* ignora */
  }
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  // Solo su iPhone/iPad, non ancora installata e solo dal sito pubblicato (HTTPS).
  return isIOS && !standalone && window.isSecureContext
}

/** Suggerisce di aggiungere l'app alla schermata Home (solo su iOS, una volta). */
export function InstallHint() {
  const [visible, setVisible] = useState(shouldShow)
  if (!visible) return null
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignora */
    }
    setVisible(false)
  }
  return (
    <Card variant="glass" compact className={styles.hint}>
      <div className={styles.body}>
        <Chip tone="accent">Installa</Chip>
        <p className="small">
          Tocca <ShareIcon size={14} className={styles.inline} /> <strong>Condividi</strong> in basso, poi <strong>Aggiungi alla schermata Home</strong>:
          l'app si apre a schermo intero e funziona anche offline.
        </p>
      </div>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Chiudi">
        <CloseIcon size={16} />
      </button>
    </Card>
  )
}

