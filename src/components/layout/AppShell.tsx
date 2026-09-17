import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { Toaster } from '../ui/Toaster'
import styles from './AppShell.module.css'

/** Struttura comune a tutte le pagine: contenuto scorrevole + barra in basso. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <main className={styles.page}>{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
