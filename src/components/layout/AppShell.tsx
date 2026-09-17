import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Toaster } from '../ui/Toaster'
import styles from './AppShell.module.css'

/** Struttura comune a tutte le pagine: contenuto scorrevole + barra in basso. */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  // Cambiando sezione si riparte dall'alto (come in un'app nativa).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <div className={styles.shell}>
      {/* La key fa ripartire la piccola animazione di ingresso a ogni pagina. */}
      <main key={pathname} className={`${styles.page} ${styles.enter}`}>
        {children}
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}

