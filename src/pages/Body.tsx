import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { BodyEntry } from '../db/types'
import { useSettings } from '../hooks/useSettings'
import { useNewFromQuery } from '../hooks/useNewFromQuery'
import { CIRCUMFERENCES, measureSummary, sortByDate, waistToHeight, weightPoints, weightSummary } from '../lib/body'
import { addDays, formatRelativeDay, todayISO } from '../lib/date'
import { fmtNum, fmtSigned } from '../lib/format'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { IconButton } from '../components/ui/Button'
import { Metric } from '../components/ui/Metric'
import { Sun } from '../components/ui/Sun'
import { Segmented } from '../components/ui/Controls'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { PlusIcon } from '../components/ui/Icons'
import { List, ListRow } from '../components/ui/ListRow'
import { WeightChart } from '../components/body/WeightChart'
import { WaistRatio } from '../components/body/WaistRatio'
import { BodyForm } from '../components/body/BodyForm'
import styles from './Body.module.css'

type Range = '30' | '90' | 'all'

export function BodyPage() {
  const settings = useSettings()
  const entries = useLiveQuery(() => db.body.toArray(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BodyEntry | undefined>()
  const [range, setRange] = useState<Range>('90')
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(() => (entries ? sortByDate(entries) : []), [entries])
  const last = sorted[sorted.length - 1]
  const weight = useMemo(() => weightSummary(sorted), [sorted])
  const points = useMemo(() => weightPoints(sorted), [sorted])
  const waist = useMemo(() => measureSummary(sorted, 'waistCm'), [sorted])
  const ratio = waistToHeight(waist.latest, settings?.heightCm)

  const visiblePoints = useMemo(() => {
    if (range === 'all') return points
    const from = addDays(todayISO(), -Number(range))
    return points.filter((p) => p.date >= from)
  }, [points, range])

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  useNewFromQuery(openNew)
  const openEdit = (e: BodyEntry) => {
    setEditing(e)
    setFormOpen(true)
  }

  const recent = [...sorted].reverse()
  const listed = showAll ? recent : recent.slice(0, 8)

  return (
    <>
      <PageHeader
        title="Corpo"
        eyebrow={last ? `Ultima misurazione: ${formatRelativeDay(last.date).toLowerCase()}` : 'Peso e circonferenze'}
        actions={
          <IconButton variant="accent" label="Nuova misurazione" onClick={openNew}>
            <PlusIcon />
          </IconButton>
        }
      />

      {entries && entries.length === 0 ? (
        <Card variant="glass">
          <EmptyState
            title="Nessuna misurazione"
            text="Pesati al mattino, a digiuno, sempre nello stesso momento: conta la media della settimana, non il singolo giorno."
            action={
              <Button icon={<PlusIcon size={18} />} onClick={openNew}>
                Prima misurazione
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="stack">
          {/* ---- Peso medio (in evidenza) ---- */}
          <Card variant="dark" className={styles.hero}>
            <Sun size={140} top={-56} right={-36} />
            <div className={styles.heroBody}>
              <Metric
                label="Peso medio · 7 giorni"
                value={fmtNum(weight.avg7, 1)}
                unit="kg"
                size="hero"
                delta={
                  weight.deltaWeek === undefined
                    ? 'Continua a pesarti: la media si stabilizza in una settimana'
                    : Math.abs(weight.deltaWeek) < 0.05
                      ? 'Stabile rispetto alla settimana prima'
                      : `${fmtSigned(weight.deltaWeek, 1)} kg rispetto alla settimana prima`
                }
              />
              <div className={styles.heroRow}>
                <Metric label="Ultima pesata" value={fmtNum(weight.latest, 1)} unit="kg" size="sm" />
                <Metric
                  label="Dall'inizio"
                  value={weight.deltaStart !== undefined ? fmtSigned(weight.deltaStart, 1) : '–'}
                  unit={weight.deltaStart !== undefined ? 'kg' : undefined}
                  size="sm"
                />
              </div>
            </div>
          </Card>

          {/* ---- Vita / altezza ---- */}
          <Card variant="glass">
            <WaistRatio ratio={ratio} waistCm={waist.latest} heightCm={settings?.heightCm} />
          </Card>

          {/* ---- Grafico peso ---- */}
          <Card>
            <div className="stack-sm">
              <div className="row-between">
                <h2>Andamento peso</h2>
              </div>
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
              {visiblePoints.length >= 2 ? (
                <WeightChart points={visiblePoints} />
              ) : (
                <p className="muted small" style={{ padding: '12px 0' }}>
                  {points.length < 2 ? 'Il grafico compare dalla seconda pesata.' : 'Nessuna pesata in questo periodo.'}
                </p>
              )}
              <p className={styles.legend}>
                <span className={styles.legendLine} /> media 7 giorni
                <span className={styles.legendDot} /> singola pesata
              </p>
            </div>
          </Card>

          {/* ---- Circonferenze ---- */}
          <Card>
            <div className="stack-sm">
              <h2>Circonferenze</h2>
              <div className={styles.measures}>
                {CIRCUMFERENCES.map((c) => {
                  const m = measureSummary(sorted, c.key)
                  return (
                    <Metric
                      key={c.key}
                      label={c.label}
                      value={fmtNum(m.latest, 1)}
                      unit={m.latest !== undefined ? 'cm' : undefined}
                      size="sm"
                      delta={m.delta === undefined ? undefined : m.delta === 0 ? "come all'inizio" : `${fmtSigned(m.delta, 1)} cm dall'inizio`}
                      deltaTone={m.delta === undefined ? 'neutral' : m.delta < 0 ? 'good' : m.delta > 0 ? 'bad' : 'neutral'}
                    />
                  )
                })}
              </div>
            </div>
          </Card>

          {/* ---- Elenco ---- */}
          <Card variant="glass" compact>
            <div className="stack-sm">
              <List title="Misurazioni">
                {listed.map((e) => (
                  <ListRow
                    key={e.id}
                    title={formatRelativeDay(e.date)}
                    meta={
                      CIRCUMFERENCES.filter((c) => e[c.key] !== undefined)
                        .map((c) => `${c.label} ${fmtNum(e[c.key], 1)}`)
                        .join(' · ') || (e.notes ? e.notes : 'Solo peso')
                    }
                    value={e.weightKg !== undefined ? fmtNum(e.weightKg, 1) : '–'}
                    unit={e.weightKg !== undefined ? 'kg' : undefined}
                    onClick={() => openEdit(e)}
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

      <BodyForm open={formOpen} onClose={() => setFormOpen(false)} entry={editing} last={last} />
    </>
  )
}
