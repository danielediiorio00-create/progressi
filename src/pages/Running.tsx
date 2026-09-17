import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Run } from '../db/types'
import { useSettings } from '../hooks/useSettings'
import { useNewFromQuery } from '../hooks/useNewFromQuery'
import { sortByDate } from '../lib/body'
import { addDays, formatRelativeDay, todayISO } from '../lib/date'
import { fmtDuration, fmtNum, fmtPace } from '../lib/format'
import { paceSecPerKm, runPoints, runStats, runTypeLabel, runsInWeek, speedKmh } from '../lib/running'
import { Card } from '../components/ui/Card'
import { HeaderButton, PageHeader } from '../components/ui/PageHeader'
import { Button, IconButton } from '../components/ui/Button'
import { Metric } from '../components/ui/Metric'
import { Sun } from '../components/ui/Sun'
import { Chip, Segmented } from '../components/ui/Controls'
import { EmptyState } from '../components/ui/EmptyState'
import { List, ListRow } from '../components/ui/ListRow'
import { HeartIcon, PlusIcon } from '../components/ui/Icons'
import { DistanceChart, PaceChart } from '../components/running/RunCharts'
import { RunForm } from '../components/running/RunForm'
import styles from './Running.module.css'

type Range = '30' | '90' | 'all'

export function RunningPage() {
  const settings = useSettings()
  const runs = useLiveQuery(() => db.runs.toArray(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Run | undefined>()
  const [range, setRange] = useState<Range>('90')
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(() => (runs ? sortByDate(runs) : []), [runs])
  const last = sorted[sorted.length - 1]
  const stats = useMemo(() => runStats(sorted), [sorted])
  const week = useMemo(() => runStats(runsInWeek(sorted)), [sorted])
  const points = useMemo(() => runPoints(sorted), [sorted])
  const visible = useMemo(() => {
    if (range === 'all') return points
    const from = addDays(todayISO(), -Number(range))
    return points.filter((p) => p.date >= from)
  }, [points, range])

  const lastPace = last ? paceSecPerKm(last.distanceKm, last.durationSec) : undefined
  const lastSpeed = last ? speedKmh(last.distanceKm, last.durationSec) : undefined

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  useNewFromQuery(openNew)
  const openEdit = (r: Run) => {
    setEditing(r)
    setFormOpen(true)
  }

  const recent = [...sorted].reverse()
  const listed = showAll ? recent : recent.slice(0, 8)
  const target = settings?.weeklyRunTarget ?? 3

  return (
    <>
      <PageHeader
        title="Corsa"
        eyebrow={last ? `Ultima corsa: ${formatRelativeDay(last.date).toLowerCase()}` : 'Distanza, tempo e passo'}
        actions={
          <>
            <HeaderButton to="/corsa/frequenza-cardiaca" label="Frequenza cardiaca">
              <HeartIcon size={20} />
            </HeaderButton>
            <IconButton variant="accent" label="Nuova corsa" onClick={openNew}>
              <PlusIcon />
            </IconButton>
          </>
        }
      />

      {runs && runs.length === 0 ? (
        <Card variant="glass">
          <EmptyState
            title="Nessuna corsa"
            text="Registra distanza e tempo: passo e velocità si calcolano da soli. Bastano 20 secondi."
            action={
              <Button icon={<PlusIcon size={18} />} onClick={openNew}>
                Prima corsa
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="stack">
          {/* ---- Ultima corsa (in evidenza) ---- */}
          {last && (
            <Card variant="dark" className={styles.hero}>
              <Sun size={140} top={-56} right={-36} />
              <div className={styles.heroBody}>
                <div className="row-between">
                  <Metric label="Ultima corsa" value={fmtNum(last.distanceKm, 2)} unit="km" size="hero" />
                </div>
                <div className={styles.heroRow}>
                  <Metric label="Tempo" value={fmtDuration(last.durationSec)} size="sm" />
                  <Metric label="Passo" value={fmtPace(lastPace)} unit="/km" size="sm" />
                  <Metric label="Velocità" value={fmtNum(lastSpeed, 1)} unit="km/h" size="sm" />
                </div>
                <div className={styles.chips}>
                  <Chip>{runTypeLabel(last.type)}</Chip>
                  <Chip tone={last.feeling >= 7 ? 'good' : last.feeling >= 4 ? 'neutral' : 'bad'}>sensazione {last.feeling}/10</Chip>
                </div>
              </div>
            </Card>
          )}

          {/* ---- Settimana e totali ---- */}
          <Card variant="glass">
            <div className="stack-sm">
              <div className="row-between">
                <h2>Questa settimana</h2>
                <Chip tone={week.count >= target ? 'good' : 'neutral'}>
                  {week.count} / {target} corse
                </Chip>
              </div>
              <div className={styles.triple}>
                <Metric label="Corse" value={week.count} size="sm" />
                <Metric label="Km" value={fmtNum(week.totalKm, 1)} size="sm" />
                <Metric label="Tempo" value={fmtDuration(week.totalSec)} size="sm" />
              </div>
              <p className="muted small">
                Totale: {stats.count} {stats.count === 1 ? 'corsa' : 'corse'} · {fmtNum(stats.totalKm, 1)} km · {fmtDuration(stats.totalSec)}
              </p>
            </div>
          </Card>

          {/* ---- Grafici ---- */}
          <Card>
            <div className="stack-sm">
              <h2>Andamento</h2>
              <Segmented
                ariaLabel="Periodo"
                value={range}
                onChange={setRange}
                options={[
                  { value: '30', label: '30 giorni' },
                  { value: '90', label: '90 giorni' },
                  { value: 'all', label: 'Tutto' },
                ]}
              />
              {visible.length >= 2 ? (
                <>
                  <p className={`label ${styles.chartLabel}`}>Distanza per corsa (km)</p>
                  <DistanceChart points={visible} />
                  <p className={`label ${styles.chartLabel}`}>Passo (min/km) · in alto = più veloce</p>
                  <PaceChart points={visible} />
                  <p className={styles.legend}>
                    <span className={styles.dotFilled} /> esterno
                    <span className={styles.dotHollow} /> tapis roulant
                  </p>
                </>
              ) : (
                <p className="muted small" style={{ padding: '12px 0' }}>
                  {points.length < 2 ? 'I grafici compaiono dalla seconda corsa.' : 'Nessuna corsa in questo periodo.'}
                </p>
              )}
            </div>
          </Card>

          {/* ---- Record ---- */}
          <Card>
            <div className="stack-sm">
              <h2>Record personali</h2>
              <div className={styles.triple}>
                <Metric
                  label="Distanza"
                  value={stats.longest ? fmtNum(stats.longest.distanceKm, 2) : '–'}
                  unit={stats.longest ? 'km' : undefined}
                  size="sm"
                  delta={stats.longest ? formatRelativeDay(stats.longest.date) : undefined}
                />
                <Metric
                  label="Passo"
                  value={stats.bestPace ? fmtPace(paceSecPerKm(stats.bestPace.distanceKm, stats.bestPace.durationSec)) : '–'}
                  unit={stats.bestPace ? '/km' : undefined}
                  size="sm"
                  delta={stats.bestPace ? formatRelativeDay(stats.bestPace.date) : undefined}
                />
                <Metric
                  label="Tempo"
                  value={stats.longestDuration ? fmtDuration(stats.longestDuration.durationSec) : '–'}
                  size="sm"
                  delta={stats.longestDuration ? formatRelativeDay(stats.longestDuration.date) : undefined}
                />
              </div>
            </div>
          </Card>

          {/* ---- Elenco ---- */}
          <Card variant="glass" compact>
            <div className="stack-sm">
              <List title="Corse">
                {listed.map((r) => (
                  <ListRow
                    key={r.id}
                    title={formatRelativeDay(r.date)}
                    meta={`${fmtDuration(r.durationSec)} · ${fmtPace(paceSecPerKm(r.distanceKm, r.durationSec), true)} · ${runTypeLabel(r.type).toLowerCase()} · ${r.feeling}/10`}
                    value={fmtNum(r.distanceKm, 2)}
                    unit="km"
                    onClick={() => openEdit(r)}
                  />
                ))}
              </List>
              {recent.length > 8 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Mostra meno' : `Mostra tutte (${recent.length})`}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      <RunForm open={formOpen} onClose={() => setFormOpen(false)} run={editing} last={last} />
    </>
  )
}
