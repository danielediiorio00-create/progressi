import { NavLink } from 'react-router-dom'
import { BodyIcon, GymIcon, HomeIcon, ReportIcon, RunIcon } from '../ui/Icons'
import styles from './BottomNav.module.css'

const items = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/corpo', label: 'Corpo', Icon: BodyIcon },
  { to: '/corsa', label: 'Corsa', Icon: RunIcon },
  { to: '/palestra', label: 'Palestra', Icon: GymIcon },
  { to: '/report', label: 'Report', Icon: ReportIcon },
]

/** Barra di navigazione a pillola, in vetro smerigliato, fissa in basso. */
export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Sezioni">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} viewTransition className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
          <span className={styles.icon}>
            <Icon size={21} />
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
