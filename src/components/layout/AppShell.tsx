import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Toaster } from '../ui/Toaster'
import styles from './AppShell.module.css'

/**
 * Struttura comune a tutte le pagine: contenuto scorrevole + barra in basso.
 * Il passaggio tra pagine usa le View Transitions del browser (dissolvenza
 * gestita dal sistema, fluida su iPhone); dove non sono supportate il cambio
 * e' immediato.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  // Cambiando sezione si riparte dall'alto (come in un'app nativa).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <div className={styles.shell}>
      <main className={styles.page}>{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
