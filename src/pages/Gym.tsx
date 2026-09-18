import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { GymSession } from '../db/types'
import { useSettings } from '../hooks/useSettings'
import { useNewFromQuery } from '../hooks/useNewFromQuery'
import { sortByDate } from '../lib/body'
import { formatRelativeDay } from '../lib/date'
import { fmtNum } from '../lib/format'
import { exerciseMap, exercisePoints, formatEntry, lastEntryFor, sessionSets, sessionSummary, sessionVolume, sessionsInWeek } from '../lib/gym'
import { Card } from '../components/ui/Card'
import { HeaderButton, PageHeader } from '../components/ui/PageHeader'
import { Button, IconButton } from '../components/ui/Button'
import { Metric } from '../components/ui/Metric'
import { Sun } from '../components/ui/Sun'
import { Chip } from '../components/ui/Controls'
import { EmptyState } from '../components/ui/EmptyState'
import { List, ListRow } from '../components/ui/ListRow'
import { ArrowRightIcon, ClipboardIcon, ListIcon, PlusIcon } from '../components/ui/Icons'
import { suggestNextDay } from '../lib/plan'
import { GymForm } from '../components/gym/GymForm'
import { LoadChart } from '../components/gym/LoadChart'
import styles from './Gym.module.css'

export function GymPage() {
  const settings = useSettings()
  const sessions = useLiveQuery(() => db.gym.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.orderBy('sortOrder').toArray(), [])
  const plans = useLiveQuery(() => db.plans.toArray(), [])
  const plan = plans && plans.length ? plans[plans.length - 1] : undefined
  const [initialDay, setInitialDay] = useState<string | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GymSession | undefined>()
  const [selected, setSelected] = useState<number | undefined>()
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(() => (sessions ? sortByDate(sessions) : []), [sessions])
  const byId = useMemo(() => exerciseMap(exercises ?? []), [exercises])
  const last = sorted[sorted.length - 1]
  const week = useMemo(() => sessionsInWeek(sorted), [sorted])
  const weekSets = week.reduce((n, s) => n + sessionSets(s), 0)
  const weekVolume = week.reduce((v, s) => v + sessionVolume(s, byId), 0)
  const target = settings?.weeklyGymTarget ?? 2

  // Esercizi che compaiono in almeno una seduta, nell'ordine della lista.
  const used = useMemo(() => (exercises ?? []).filter((ex) => sorted.some((s) => s.entries.some((e) => e.exerciseId === ex.id))), [exercises, sorted])

  // Esercizio selezionato per il grafico: di default il primo dell'ultima seduta.
  useEffect(() => {
    if (selected !== undefined && used.some((e) => e.id === selected)) return
    const first = last?.entries[0]?.exerciseId ?? used[0]?.id
    if (first !== undefined) setSelected(first)
  }, [selected, used, last])

  const selectedEx = selected !== undefined ? byId.get(selected) : undefined
  const points = useMemo(() => (selectedEx ? exercisePoints(sorted, selectedEx) : []), [sorted, selectedEx])
  const lastFor = selectedEx ? lastEntryFor(sorted, selectedEx.id!) : undefined
  const best = points.length ? Math.max(...points.map((p) => p.value)) : undefined
  const unit = selectedEx?.mode === 'time' ? 's' : 'kg'

  const openNew = (day?: string) => {
    setEditing(undefined)
    setInitialDay(day)
    setFormOpen(true)
  }
  useNewFromQuery((params) => openNew(params.get('giorno') ?? undefined))
  const nextDay = plan && sessions ? suggestNextDay(plan, sessions) : undefined
  const openEdit = (s: GymSession) => {
    setEditing(s)
    setInitialDay(undefined)
    setFormOpen(true)
  }

  const recent = [...sorted].reverse()
  const listed = showAll ? recent : recent.slice(0, 8)

  return (
    <>
      <PageHeader
        title="Palestra"
        eyebrow={last ? `Ultima seduta: ${formatRelativeDay(last.date).toLowerCase()}` : 'Serie, ripetizioni e carichi'}
        actions={
          <>
            <HeaderButton to="/palestra/scheda" label="Scheda">
              <ClipboardIcon size={20} />
            </HeaderButton>
            <HeaderButton to="/palestra/esercizi" label="Esercizi">
              <ListIcon size={20} />
            </HeaderButton>
            <IconButton variant="accent" label="Nuova seduta" onClick={() => openNew()}>
              <PlusIcon />
            </IconButton>
          </>
        }
      />

      {sessions && sessions.length === 0 ? (
        <Card variant="glass">
          <EmptyState
            title="Nessuna seduta"
            text="Aggiungi gli esercizi fatti con serie, ripetizioni, carico e RIR (le ripetizioni che ti restavano). La volta dopo trovi già i carichi precompilati."
            action={
              <div className="stack-sm">
                <Button icon={<PlusIcon size={18} />} onClick={() => openNew()}>
                  Prima seduta
                </Button>
                <Link viewTransition to="/palestra/scheda" className={styles.link}>
                  Oppure crea prima la scheda <ArrowRightIcon size={16} />
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="stack">
          {/* ---- Settimana (in evidenza) ---- */}
          <Card variant="dark" className={styles.hero}>
            <Sun size={140} top={-56} right={-36} />
            <div className={styles.heroBody}>
              <Metric label="Sedute questa settimana" value={week.length} unit={`/ ${target}`} size="hero" />
              <div className={styles.heroRow}>
                <Metric label="Serie" value={weekSets} size="sm" />
                <Metric label="Volume" value={fmtNum(weekVolume, 0)} unit="kg" size="sm" />
                <Metric label="Totale" value={sorted.length} unit={sorted.length === 1 ? 'seduta' : 'sedute'} size="sm" />
              </div>
            </div>
          </Card>

          {/* ---- Scheda ---- */}
          <Card variant="glass">
            {plan ? (
              <div className={styles.planRow}>
                <div className="grow">
                  <span className="label">Scheda · {plan.name}</span>
                  <p className={styles.planNext}>{nextDay ? `Prossimo: ${nextDay.name}` : 'Nessun giorno con esercizi'}</p>
                  <Link viewTransition to="/palestra/scheda" className={styles.link}>
                    Apri la scheda <ArrowRightIcon size={16} />
                  </Link>
                </div>
                {nextDay && (
                  <Button size="sm" icon={<ArrowRightIcon size={16} />} onClick={() => openNew(nextDay.name)}>
                    Inizia
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.planRow}>
                <div className="grow">
                  <span className="label">Scheda</span>
                  <p className={styles.planNext}>Segui un programma: ogni seduta parte già compilata.</p>
                </div>
                <Link viewTransition to="/palestra/scheda" className={styles.linkBtn}>
                  Crea
                </Link>
              </div>
            )}
          </Card>

          {/* ---- Progressione carico ---- */}
          {used.length > 0 && (
            <Card>
              <div className="stack-sm">
                <h2>Progressione</h2>
                <div className={styles.scroller}>
                  {used.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      className={`${styles.exChip} ${ex.id === selected ? styles.exChipActive : ''}`}
                      onClick={() => setSelected(ex.id)}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
                {selectedEx && (
                  <>
                    {points.length >= 2 ? (
                      <LoadChart exercise={selectedEx} points={points} />
                    ) : (
                      <p className="muted small" style={{ padding: '12px 0' }}>
                        Il grafico compare dalla seconda seduta con questo esercizio.
                      </p>
                    )}
                    <div className={styles.triple}>
                      <Metric label="Ultimo" value={points.length ? fmtNum(points[points.length - 1].value, 1) : '–'} unit={unit} size="sm" />
                      <Metric label="Massimo" value={best !== undefined ? fmtNum(best, 1) : '–'} unit={unit} size="sm" />
                      <Metric label="Sedute" value={points.length} size="sm" />
                    </div>
                    {lastFor && (
                      <p className="muted small">
                        Ultima volta ({formatRelativeDay(lastFor.date).toLowerCase()}): {formatEntry(lastFor.entry, selectedEx)}
                        {lastFor.entry.rir !== undefined && selectedEx.mode !== 'time' ? ` · RIR ${lastFor.entry.rir}` : ''}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* ---- Elenco ---- */}
          <Card variant="glass" compact>
            <div className="stack-sm">
              <List title="Sedute">
                {listed.map((s) => (
                  <ListRow
                    key={s.id}
                    title={formatRelativeDay(s.date)}
                    meta={sessionSummary(s, byId)}
                    aside={<Chip>{s.entries.length} es.</Chip>}
                    value={sessionSets(s)}
                    unit="serie"
                    onClick={() => openEdit(s)}
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

      <GymForm open={formOpen} onClose={() => setFormOpen(false)} session={editing} sessions={sorted} exercises={exercises ?? []} plan={plan} initialDay={initialDay} />
    </>
  )
}
