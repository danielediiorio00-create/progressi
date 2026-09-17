import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { db } from '../../db/db'
import type { Exercise, GymEntry, GymSession } from '../../db/types'
import { formatRelativeDay, todayISO } from '../../lib/date'
import { parseNum } from '../../lib/format'
import { exerciseMap, formatEntry, lastEntryFor } from '../../lib/gym'
import { toast } from '../../hooks/useToast'
import { Sheet } from '../ui/Sheet'
import { Field, TextArea, TextInput } from '../ui/Field'
import { ActionPair, Button } from '../ui/Button'
import { CalendarIcon, CloseIcon, NoteIcon, PlusIcon, RepeatIcon, TrashIcon } from '../ui/Icons'
import styles from './GymForm.module.css'

interface GymFormProps {
  open: boolean
  onClose: () => void
  /** Seduta da modificare; se assente se ne crea una nuova. */
  session?: GymSession
  sessions: GymSession[]
  exercises: Exercise[]
}

interface EntryDraft {
  key: number
  exerciseId: number
  sets: string
  reps: string
  weight: string
  rir: string
}

let draftKey = 1
const str = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','))

function draftFrom(exerciseId: number, e?: GymEntry): EntryDraft {
  return { key: draftKey++, exerciseId, sets: str(e?.sets), reps: str(e?.reps), weight: str(e?.weightKg), rir: str(e?.rir) }
}

/** Modulo della seduta: esercizi con serie x ripetizioni x carico e RIR. */
export function GymForm({ open, onClose, session, sessions, exercises }: GymFormProps) {
  const [date, setDate] = useState(todayISO())
  const [entries, setEntries] = useState<EntryDraft[]>([])
  const [notes, setNotes] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const editing = session?.id !== undefined
  const byId = useMemo(() => exerciseMap(exercises), [exercises])

  // Sedute precedenti a quella in modifica: servono per "ultima volta".
  const previous = useMemo(() => sessions.filter((s) => s.id !== session?.id), [sessions, session])
  const lastSession = useMemo(() => [...previous].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id! - a.id!))[0], [previous])

  useEffect(() => {
    if (!open) return
    setDate(session?.date ?? todayISO())
    setEntries(session ? session.entries.map((e) => draftFrom(e.exerciseId, e)) : [])
    setNotes(session?.notes ?? '')
    setNewName('')
    setAdding(false)
  }, [open, session])

  const available = exercises.filter((ex) => !ex.archived && !entries.some((d) => d.exerciseId === ex.id))

  /** Aggiunge un esercizio precompilato con l'ultimo carico usato. */
  const addExercise = (exerciseId: number) => {
    const last = lastEntryFor(previous, exerciseId)
    setEntries((list) => [...list, draftFrom(exerciseId, last?.entry)])
  }

  const repeatLast = () => {
    if (!lastSession) return
    setEntries(lastSession.entries.map((e) => draftFrom(e.exerciseId, e)))
  }

  const update = (key: number, patch: Partial<EntryDraft>) =>
    setEntries((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const remove = (key: number) => setEntries((list) => list.filter((d) => d.key !== key))

  const createExercise = async () => {
    const name = newName.trim()
    if (!name) return
    const sortOrder = exercises.reduce((m, e) => Math.max(m, e.sortOrder), -1) + 1
    const id = (await db.exercises.add({ name, mode: 'reps', sortOrder })) as number
    setNewName('')
    setAdding(false)
    setEntries((list) => [...list, draftFrom(id)])
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!date) return toast('Inserisci la data', 'error')
    if (entries.length === 0) return toast('Aggiungi almeno un esercizio', 'error')

    const parsed: GymEntry[] = []
    for (const d of entries) {
      const ex = byId.get(d.exerciseId)
      const name = ex?.name ?? 'Esercizio'
      const sets = parseNum(d.sets)
      const reps = parseNum(d.reps)
      const weight = parseNum(d.weight)
      const rir = parseNum(d.rir)
      if (sets === undefined || !Number.isInteger(sets) || sets < 1 || sets > 30) return toast(`${name}: serie da 1 a 30`, 'error')
      if (reps === undefined || reps < 1 || reps > 999) return toast(`${name}: ${ex?.mode === 'time' ? 'secondi' : 'ripetizioni'} da 1 a 999`, 'error')
      if (d.weight.trim() !== '' && (weight === undefined || weight < 0 || weight > 500)) return toast(`${name}: carico non valido`, 'error')
      if (d.rir.trim() !== '' && (rir === undefined || rir < 0 || rir > 10)) return toast(`${name}: RIR da 0 a 10`, 'error')
      parsed.push({
        exerciseId: d.exerciseId,
        sets,
        reps: Math.round(reps),
        weightKg: weight !== undefined && weight > 0 ? weight : undefined,
        rir: ex?.mode === 'time' ? undefined : rir,
      })
    }

    const record: GymSession = { date, entries: parsed, notes: notes.trim() || undefined }
    if (editing) {
      await db.gym.put({ ...record, id: session!.id })
      toast('Seduta aggiornata', 'success')
    } else {
      await db.gym.add(record)
      toast('Seduta salvata', 'success')
    }
    onClose()
  }

  const removeSession = async () => {
    if (!editing) return
    if (!window.confirm('Eliminare questa seduta?')) return
    await db.gym.delete(session!.id!)
    toast('Seduta eliminata')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifica seduta' : 'Nuova seduta'}>
      <form className="stack" onSubmit={save}>
        <Field label="Data" icon={<CalendarIcon size={18} />}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} required />
        </Field>

        {entries.length === 0 && lastSession && (
          <Button variant="secondary" icon={<RepeatIcon size={18} />} onClick={repeatLast} full>
            Ripeti l'ultima seduta ({formatRelativeDay(lastSession.date).toLowerCase()})
          </Button>
        )}

        {entries.map((d) => {
          const ex = byId.get(d.exerciseId)
          const time = ex?.mode === 'time'
          const last = lastEntryFor(previous, d.exerciseId)
          return (
            <div key={d.key} className={styles.entry}>
              <div className={styles.entryHead}>
                <span className={styles.entryName}>{ex?.name ?? 'Esercizio'}</span>
                <button type="button" className={styles.entryRemove} onClick={() => remove(d.key)} aria-label={`Togli ${ex?.name ?? 'esercizio'}`}>
                  <CloseIcon size={16} />
                </button>
              </div>
              <div className={styles.entryGrid}>
                <label className={styles.mini}>
                  <span className={styles.miniLabel}>Serie</span>
                  <input className={styles.miniInput} inputMode="numeric" value={d.sets} onChange={(e) => update(d.key, { sets: e.target.value })} placeholder="3" />
                </label>
                <label className={styles.mini}>
                  <span className={styles.miniLabel}>{time ? 'Secondi' : 'Rip.'}</span>
                  <input className={styles.miniInput} inputMode="numeric" value={d.reps} onChange={(e) => update(d.key, { reps: e.target.value })} placeholder={time ? '45' : '12'} />
                </label>
                <label className={styles.mini}>
                  <span className={styles.miniLabel}>kg</span>
                  <input className={styles.miniInput} inputMode="decimal" value={d.weight} onChange={(e) => update(d.key, { weight: e.target.value })} placeholder="–" />
                </label>
                {!time && (
                  <label className={styles.mini}>
                    <span className={styles.miniLabel}>RIR</span>
                    <input className={styles.miniInput} inputMode="numeric" value={d.rir} onChange={(e) => update(d.key, { rir: e.target.value })} placeholder="–" />
                  </label>
                )}
              </div>
              {last && (
                <p className={styles.entryHint}>
                  Ultima volta ({formatRelativeDay(last.date).toLowerCase()}): {formatEntry(last.entry, ex)}
                  {last.entry.rir !== undefined && !time ? ` · RIR ${last.entry.rir}` : ''}
                </p>
              )}
            </div>
          )
        })}

        <div className="stack-sm">
          <span className="label">Aggiungi esercizio</span>
          <div className={styles.chips}>
            {available.map((ex) => (
              <button key={ex.id} type="button" className={styles.chip} onClick={() => addExercise(ex.id!)}>
                <PlusIcon size={14} /> {ex.name}
              </button>
            ))}
            {!adding && (
              <button type="button" className={`${styles.chip} ${styles.chipNew}`} onClick={() => setAdding(true)}>
                Nuovo…
              </button>
            )}
          </div>
          {adding && (
            <div className={styles.newRow}>
              <input
                className={styles.newInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome esercizio"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createExercise()
                  }
                }}
              />
              <Button size="sm" onClick={createExercise} disabled={!newName.trim()}>
                Aggiungi
              </Button>
            </div>
          )}
        </div>

        <Field label="Note" icon={<NoteIcon size={18} />}>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Facoltative: energia, dolori, tecnica..." />
        </Field>

        <ActionPair type="submit" label={editing ? 'Salva modifiche' : 'Salva seduta'} />
        {editing && (
          <Button variant="danger" icon={<TrashIcon size={18} />} onClick={removeSession} full>
            Elimina seduta
          </Button>
        )}
      </form>
    </Sheet>
  )
}
