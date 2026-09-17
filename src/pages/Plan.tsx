import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Plan, PlanExercise } from '../db/types'
import { toast } from '../hooks/useToast'
import { formatDateTime } from '../lib/date'
import { fmtNum } from '../lib/format'
import { exerciseMap, lastEntryFor } from '../lib/gym'
import { formatPlanExercise, planToMarkdown, suggestNextDay, syncPlanLoads } from '../lib/plan'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button, IconButton } from '../components/ui/Button'
import { Chip } from '../components/ui/Controls'
import { EmptyState } from '../components/ui/EmptyState'
import { List, ListRow } from '../components/ui/ListRow'
import { ArrowRightIcon, ClipboardIcon, CopyIcon, EditIcon, PlusIcon, RepeatIcon } from '../components/ui/Icons'
import { PlanImportSheet } from '../components/gym/PlanImportSheet'
import { NameSheet, PlanExerciseSheet } from '../components/gym/PlanSheets'
import styles from './Plan.module.css'

type ExerciseTarget = { dayIndex: number; exIndex?: number }
type NameTarget = { kind: 'plan' } | { kind: 'day'; dayIndex?: number }

/** Scheda di allenamento: giorni, esercizi, carichi di riferimento. */
export function PlanPage() {
  const navigate = useNavigate()
  const plans = useLiveQuery(() => db.plans.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.orderBy('sortOrder').toArray(), [])
  const sessions = useLiveQuery(() => db.gym.toArray(), [])
  const [importOpen, setImportOpen] = useState(false)
  const [exTarget, setExTarget] = useState<ExerciseTarget | undefined>()
  const [nameTarget, setNameTarget] = useState<NameTarget | undefined>()

  const plan = plans && plans.length ? plans[plans.length - 1] : undefined
  const byId = useMemo(() => exerciseMap(exercises ?? []), [exercises])
  const next = plan && sessions ? suggestNextDay(plan, sessions) : undefined
  const exerciseCount = plan?.days.reduce((n, d) => n + d.exercises.length, 0) ?? 0

  const savePlan = async (updated: Plan) => {
    await db.plans.put({ ...updated, updatedAt: new Date().toISOString() })
  }

  const createEmpty = async () => {
    const now = new Date().toISOString()
    await db.plans.add({ name: 'La mia scheda', days: [{ name: 'Giorno A', exercises: [] }], createdAt: now, updatedAt: now })
  }

  const updateDay = (dayIndex: number, patch: (list: PlanExercise[]) => PlanExercise[]) => {
    if (!plan) return
    const days = plan.days.map((d, i) => (i === dayIndex ? { ...d, exercises: patch(d.exercises) } : d))
    return savePlan({ ...plan, days })
  }

  const onSync = async () => {
    if (!plan || !sessions) return
    const { plan: updated, changed } = syncPlanLoads(plan, sessions, byId)
    if (changed === 0) return toast('I carichi sono già aggiornati')
    await savePlan(updated)
    toast(`Aggiornati ${changed} ${changed === 1 ? 'carico' : 'carichi'}`, 'success')
  }

  const onCopy = async () => {
    if (!plan) return
    try {
      await navigator.clipboard.writeText(planToMarkdown(plan, byId))
      toast('Scheda copiata in Markdown', 'success')
    } catch {
      toast('Copia non riuscita', 'error')
    }
  }

  const startDay = (name: string) => navigate(`/palestra?nuova&giorno=${encodeURIComponent(name)}`)

  const editingExercise = exTarget && exTarget.exIndex !== undefined ? plan?.days[exTarget.dayIndex]?.exercises[exTarget.exIndex] : undefined

  return (
    <>
      <PageHeader
        title="Scheda"
        backTo="/palestra"
        eyebrow={plan ? `Aggiornata ${formatDateTime(plan.updatedAt)}` : 'Il programma da seguire'}
        actions={
          plan ? (
            <IconButton variant="accent" label="Nuovo giorno" onClick={() => setNameTarget({ kind: 'day' })}>
              <PlusIcon />
            </IconButton>
          ) : undefined
        }
      />

      {plans && !plan ? (
        <Card variant="glass">
          <EmptyState
            title="Nessuna scheda"
            text="Incolla la scheda del coach (o di Claude) in Markdown, oppure creala da zero. Poi ogni seduta parte già compilata."
            action={
              <div className="stack-sm">
                <Button icon={<ClipboardIcon size={18} />} onClick={() => setImportOpen(true)}>
                  Incolla da Markdown
                </Button>
                <Button variant="secondary" onClick={createEmpty}>
                  Crea da zero
                </Button>
              </div>
            }
          />
        </Card>
      ) : plan ? (
        <div className="stack">
          <Card variant="dark">
            <div className="stack-sm">
              <button type="button" className={styles.titleBtn} onClick={() => setNameTarget({ kind: 'plan' })}>
                <h2 className={styles.planName}>{plan.name}</h2>
                <EditIcon size={16} />
              </button>
              <p className={styles.onDark}>
                {plan.days.length} {plan.days.length === 1 ? 'giorno' : 'giorni'} · {exerciseCount} esercizi
                {next ? ` · prossimo: ${next.name}` : ''}
              </p>
              <div className={styles.darkActions}>
                <Button variant="secondary" size="sm" icon={<RepeatIcon size={16} />} onClick={onSync} className={styles.onDarkBtn}>
                  Aggiorna carichi
                </Button>
                <Button variant="secondary" size="sm" icon={<CopyIcon size={16} />} onClick={onCopy} className={styles.onDarkBtn}>
                  Copia Markdown
                </Button>
              </div>
            </div>
          </Card>

          {plan.days.map((day, dayIndex) => (
            <Card key={dayIndex} compact>
              <div className="stack-sm">
                <div className={styles.dayHead}>
                  <button type="button" className={styles.dayNameBtn} onClick={() => setNameTarget({ kind: 'day', dayIndex })}>
                    <h2>{day.name}</h2>
                    {next?.name === day.name && <Chip tone="accent">prossimo</Chip>}
                  </button>
                  <Button size="sm" icon={<ArrowRightIcon size={16} />} onClick={() => startDay(day.name)} disabled={day.exercises.length === 0}>
                    Inizia
                  </Button>
                </div>
                <List>
                  {day.exercises.map((pe, exIndex) => {
                    const ex = byId.get(pe.exerciseId)
                    const last = sessions ? lastEntryFor(sessions, pe.exerciseId)?.entry : undefined
                    const time = ex?.mode === 'time'
                    const lastValue = last ? (time ? last.reps : last.weightKg) : undefined
                    const planValue = time ? pe.reps : pe.weightKg
                    const differs = lastValue !== undefined && lastValue !== planValue
                    return (
                      <ListRow
                        key={exIndex}
                        title={ex?.name ?? 'Esercizio'}
                        meta={formatPlanExercise(pe, ex, false)}
                        aside={differs ? <Chip>ultimo {fmtNum(lastValue, 1)} {time ? 's' : 'kg'}</Chip> : undefined}
                        onClick={() => setExTarget({ dayIndex, exIndex })}
                      />
                    )
                  })}
                </List>
                <Button variant="ghost" size="sm" icon={<PlusIcon size={16} />} onClick={() => setExTarget({ dayIndex })}>
                  Aggiungi esercizio
                </Button>
              </div>
            </Card>
          ))}

          <Button variant="secondary" icon={<ClipboardIcon size={18} />} onClick={() => setImportOpen(true)} full>
            Importa un'altra scheda da Markdown
          </Button>
        </div>
      ) : null}

      <PlanImportSheet open={importOpen} onClose={() => setImportOpen(false)} exercises={exercises ?? []} current={plan} />

      <PlanExerciseSheet
        open={exTarget !== undefined}
        onClose={() => setExTarget(undefined)}
        exercises={exercises ?? []}
        value={editingExercise}
        usedIds={exTarget ? (plan?.days[exTarget.dayIndex]?.exercises.map((e) => e.exerciseId) ?? []) : []}
        onSave={(value) => {
          if (!exTarget) return
          updateDay(exTarget.dayIndex, (list) => (exTarget.exIndex === undefined ? [...list, value] : list.map((e, i) => (i === exTarget.exIndex ? value : e))))
        }}
        onRemove={
          exTarget?.exIndex !== undefined
            ? () => updateDay(exTarget.dayIndex, (list) => list.filter((_, i) => i !== exTarget.exIndex))
            : undefined
        }
      />

      <NameSheet
        open={nameTarget !== undefined}
        onClose={() => setNameTarget(undefined)}
        title={nameTarget?.kind === 'plan' ? 'Nome della scheda' : nameTarget?.dayIndex === undefined ? 'Nuovo giorno' : 'Nome del giorno'}
        label={nameTarget?.kind === 'plan' ? 'Scheda' : 'Giorno'}
        value={
          nameTarget?.kind === 'plan'
            ? (plan?.name ?? '')
            : nameTarget?.dayIndex !== undefined
              ? (plan?.days[nameTarget.dayIndex]?.name ?? '')
              : `Giorno ${String.fromCharCode(65 + (plan?.days.length ?? 0))}`
        }
        onSave={(name) => {
          if (!plan || !nameTarget) return
          if (nameTarget.kind === 'plan') return savePlan({ ...plan, name })
          if (nameTarget.dayIndex === undefined) return savePlan({ ...plan, days: [...plan.days, { name, exercises: [] }] })
          return savePlan({ ...plan, days: plan.days.map((d, i) => (i === nameTarget.dayIndex ? { ...d, name } : d)) })
        }}
        onRemove={
          nameTarget?.kind === 'day' && nameTarget.dayIndex !== undefined
            ? () => {
                if (!plan) return
                if (!window.confirm(`Eliminare "${plan.days[nameTarget.dayIndex!].name}" dalla scheda?`)) return
                savePlan({ ...plan, days: plan.days.filter((_, i) => i !== nameTarget.dayIndex) })
              }
            : nameTarget?.kind === 'plan'
              ? () => {
                  if (!plan || !window.confirm('Eliminare tutta la scheda? Le sedute registrate restano.')) return
                  db.plans.delete(plan.id!)
                }
              : undefined
        }
        removeLabel={nameTarget?.kind === 'plan' ? 'Elimina scheda' : 'Elimina giorno'}
      />
    </>
  )
}
