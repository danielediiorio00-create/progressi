import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Exercise, ExerciseMode } from '../db/types'
import { isExerciseUsed } from '../lib/gym'
import { toast } from '../hooks/useToast'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { ActionPair, Button, IconButton } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { Field, TextInput } from '../components/ui/Field'
import { Segmented } from '../components/ui/Controls'
import { List, ListRow } from '../components/ui/ListRow'
import { ArchiveIcon, ArrowDownIcon, ArrowUpIcon, GymIcon, PlusIcon, TrashIcon } from '../components/ui/Icons'
import styles from './Exercises.module.css'

/** Gestione della lista esercizi: ordine, nome, tipo, archiviazione. */
export function ExercisesPage() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('sortOrder').toArray(), [])
  const sessions = useLiveQuery(() => db.gym.toArray(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | undefined>()

  const active = useMemo(() => (exercises ?? []).filter((e) => !e.archived), [exercises])
  const archived = useMemo(() => (exercises ?? []).filter((e) => e.archived), [exercises])
  const usage = (id: number) => (sessions ?? []).filter((s) => s.entries.some((e) => e.exerciseId === id)).length

  /** Scambia la posizione con l'esercizio vicino (sopra o sotto). */
  const move = async (ex: Exercise, dir: -1 | 1) => {
    const i = active.findIndex((e) => e.id === ex.id)
    const other = active[i + dir]
    if (!other) return
    await db.transaction('rw', db.exercises, async () => {
      await db.exercises.update(ex.id!, { sortOrder: other.sortOrder })
      await db.exercises.update(other.id!, { sortOrder: ex.sortOrder })
    })
  }

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (ex: Exercise) => {
    setEditing(ex)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Esercizi"
        backTo="/palestra"
        subtitle="Tocca per rinominare, usa le frecce per l'ordine."
        actions={
          <IconButton variant="accent" label="Nuovo esercizio" onClick={openNew}>
            <PlusIcon />
          </IconButton>
        }
      />

      <div className="stack">
        <Card variant="glass" compact>
          <List>
            {active.map((ex, i) => (
              <ListRow
                key={ex.id}
                title={ex.name}
                meta={`${ex.mode === 'time' ? 'A tempo' : 'Ripetizioni'} · ${usage(ex.id!)} ${usage(ex.id!) === 1 ? 'seduta' : 'sedute'}`}
                actions={
                  <>
                    <button type="button" className={styles.arrow} onClick={() => move(ex, -1)} disabled={i === 0} aria-label={`Sposta ${ex.name} su`}>
                      <ArrowUpIcon size={16} />
                    </button>
                    <button type="button" className={styles.arrow} onClick={() => move(ex, 1)} disabled={i === active.length - 1} aria-label={`Sposta ${ex.name} giù`}>
                      <ArrowDownIcon size={16} />
                    </button>
                  </>
                }
                onClick={() => openEdit(ex)}
              />
            ))}
          </List>
          {exercises && active.length === 0 && <p className="muted small" style={{ padding: 8 }}>Nessun esercizio attivo: aggiungine uno con il +.</p>}
        </Card>

        {archived.length > 0 && (
          <Card compact>
            <List title="Archiviati">
              {archived.map((ex) => (
                <ListRow key={ex.id} title={ex.name} meta={`${usage(ex.id!)} sedute nello storico`} onClick={() => openEdit(ex)} />
              ))}
            </List>
          </Card>
        )}
      </div>

      <ExerciseForm open={formOpen} onClose={() => setFormOpen(false)} exercise={editing} exercises={exercises ?? []} used={editing ? isExerciseUsed(sessions ?? [], editing.id!) : false} />
    </>
  )
}

interface ExerciseFormProps {
  open: boolean
  onClose: () => void
  exercise?: Exercise
  exercises: Exercise[]
  used: boolean
}

function ExerciseForm({ open, onClose, exercise, exercises, used }: ExerciseFormProps) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<ExerciseMode>('reps')
  const editing = exercise?.id !== undefined

  useEffect(() => {
    if (!open) return
    setName(exercise?.name ?? '')
    setMode(exercise?.mode ?? 'reps')
  }, [open, exercise])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return toast('Inserisci il nome', 'error')
    if (exercises.some((x) => x.id !== exercise?.id && x.name.toLowerCase() === trimmed.toLowerCase())) return toast('Esiste già un esercizio con questo nome', 'error')
    if (editing) {
      await db.exercises.update(exercise!.id!, { name: trimmed, mode })
      toast('Esercizio aggiornato', 'success')
    } else {
      const sortOrder = exercises.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1
      await db.exercises.add({ name: trimmed, mode, sortOrder })
      toast('Esercizio aggiunto', 'success')
    }
    onClose()
  }

  const toggleArchive = async () => {
    if (!editing) return
    await db.exercises.update(exercise!.id!, { archived: !exercise!.archived })
    toast(exercise!.archived ? 'Esercizio ripristinato' : 'Esercizio archiviato')
    onClose()
  }

  const remove = async () => {
    if (!editing || used) return
    if (!window.confirm(`Eliminare "${exercise!.name}"?`)) return
    await db.exercises.delete(exercise!.id!)
    toast('Esercizio eliminato')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifica esercizio' : 'Nuovo esercizio'}>
      <form className="stack" onSubmit={save}>
        <Field label="Nome" icon={<GymIcon size={18} />}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Affondi" autoFocus={!editing} autoCapitalize="sentences" />
        </Field>
        <div className="stack-sm">
          <span className="label">Come si misura</span>
          <Segmented
            ariaLabel="Modalità"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'reps', label: 'Serie × ripetizioni' },
              { value: 'time', label: 'Serie × secondi' },
            ]}
          />
        </div>
        <ActionPair type="submit" label={editing ? 'Salva' : 'Aggiungi'} />
        {editing && (
          <div className="stack-sm">
            <Button variant="secondary" icon={<ArchiveIcon size={18} />} onClick={toggleArchive} full>
              {exercise!.archived ? 'Ripristina tra le scelte' : 'Archivia (resta nello storico)'}
            </Button>
            <Button variant="danger" icon={<TrashIcon size={18} />} onClick={remove} disabled={used} full>
              {used ? 'Usato in qualche seduta: archivia invece' : 'Elimina'}
            </Button>
          </div>
        )}
      </form>
    </Sheet>
  )
}
