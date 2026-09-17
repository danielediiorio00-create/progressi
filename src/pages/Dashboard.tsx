import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { formatDate, todayISO } from '../lib/date'
import { Card } from '../components/ui/Card'
import { HeaderButton, PageHeader } from '../components/ui/PageHeader'
import { Sun } from '../components/ui/Sun'
import { Metric } from '../components/ui/Metric'
import { ArrowRightIcon, SettingsIcon } from '../components/ui/Icons'
import styles from './Dashboard.module.css'

/**
 * Dashboard — in questa fase e' un'anteprima del design. I dati veri
 * (sedute della settimana, streak, variazioni, record) arrivano nella fase 5.
 */
export function DashboardPage() {
  const settings = useSettings()
  const today = formatDate(todayISO(), 'long')
  const eyebrow = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Ciao!"
        actions={
          <HeaderButton to="/impostazioni" label="Impostazioni">
            <SettingsIcon size={20} />
          </HeaderButton>
        }
      />

      <div className="stack">
        <Card variant="dark" className={styles.hero}>
          <Sun size={150} top={-50} right={-40} />
          <div className={styles.heroBody}>
            <span className="label">Questa settimana</span>
            <div className={styles.heroNumbers}>
              <Metric value="0" unit={`/ ${settings?.weeklyRunTarget ?? 3}`} label="corse" size="hero" className={styles.heroMetric} />
              <Metric value="0" unit={`/ ${settings?.weeklyGymTarget ?? 2}`} label="palestra" size="hero" className={styles.heroMetric} />
            </div>
            <p className={styles.heroText}>Le sezioni si riempiono nelle prossime fasi.</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="stack-sm">
            <h2>Setup completato</h2>
            <p className="muted small">
              Tema, navigazione, database locale e backup sono pronti. Nelle fasi successive arrivano corpo, corsa, palestra,
              dashboard e report.
            </p>
            <Link to="/impostazioni" className={styles.link}>
              Compila il profilo <ArrowRightIcon size={18} />
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
