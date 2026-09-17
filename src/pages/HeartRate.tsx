import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { sortByDate } from '../lib/body'
import { addDays, formatRelativeDay, todayISO } from '../lib/date'
import { fmtNum, fmtPace } from '../lib/format'
import { estimatedMaxHr, runPoints } from '../lib/running'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Metric } from '../components/ui/Metric'
import { Chip } from '../components/ui/Controls'
import { EmptyState } from '../components/ui/EmptyState'
import { List, ListRow } from '../components/ui/ListRow'
import { HrChart } from '../components/running/RunCharts'
import styles from './Running.module.css'

/**
 * Frequenza cardiaca: schermata separata, di proposito fuori dalla dashboard.
 * Mostra solo le corse in cui la FC media e' stata inserita.
 */
export function HeartRatePage() {
  const settings = useSettings()
  const runs = useLiveQuery(() => db.runs.toArray(), [])
  const points = useMemo(() => runPoints(sortByDate(runs ?? [])).filter((p) => p.avgHr !== undefined), [runs])

  const recent30 = points.filter((p) => p.date >= addDays(todayISO(), -30))
  const base = recent30.length > 0 ? recent30 : points
  const avg = base.length > 0 ? base.reduce((s, p) => s + p.avgHr!, 0) / base.length : undefined
  const min = base.length > 0 ? Math.min(...base.map((p) => p.avgHr!)) : undefined
  const max = base.length > 0 ? Math.max(...base.map((p) => p.avgHr!)) : undefined
  const maxHr = estimatedMaxHr(settings?.birthYear)

  return (
    <>
      <PageHeader title="Frequenza cardiaca" backTo="/corsa" subtitle="Solo qui: non compare nella dashboard." />

      {runs && points.length === 0 ? (
        <Card variant="glass">
          <EmptyState
            title="Nessun dato"
            text="La FC media è un campo facoltativo del modulo corsa: quando la inserisci, compare in questa schermata."
          />
        </Card>
      ) : (
        <div className="stack">
          <Card variant="dark">
            <div className="stack-sm">
              <Metric
                label={recent30.length > 0 ? 'FC media · ultimi 30 giorni' : 'FC media · tutte le corse'}
                value={fmtNum(avg, 0)}
                unit="bpm"
                size="hero"
              />
              <div className={styles.triple}>
                <Metric label="Minima" value={min ?? '–'} size="sm" />
                <Metric label="Massima" value={max ?? '–'} size="sm" />
                <Metric label="Max stimata" value={maxHr ?? '–'} size="sm" delta={maxHr ? '220 − età' : 'anno di nascita nel profilo'} />
              </div>
            </div>
          </Card>

          {points.length >= 2 && (
            <Card>
              <div className="stack-sm">
                <h2>Andamento</h2>
                <HrChart points={points} />
                <p className="muted small">Pieno = esterno, vuoto = tapis roulant. A parità di passo, una FC più bassa nel tempo è un buon segno.</p>
              </div>
            </Card>
          )}

          <Card variant="glass" compact>
            <List title="Corse con FC">
              {[...points].reverse().map((p) => (
                <ListRow
                  key={p.id}
                  title={formatRelativeDay(p.date)}
                  meta={`${fmtNum(p.distanceKm, 2)} km · ${fmtPace(p.paceSec, true)}`}
                  aside={maxHr ? <Chip>{Math.round((p.avgHr! / maxHr) * 100)}% max</Chip> : undefined}
                  value={p.avgHr}
                  unit="bpm"
                />
              ))}
            </List>
          </Card>
        </div>
      )}
    </>
  )
}
