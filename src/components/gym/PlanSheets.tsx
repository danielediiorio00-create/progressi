import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../../db/db'
import type { Exercise, PlanExercise } from '../../db/types'
import { parseNum } from '../../lib/format'
import { toast } from '../../hooks/useToast'
import { Sheet } from '../ui/Sheet'
import { Field, NumberInput, TextInput } from '../ui/Field'
import { ActionPair, Button } from '../ui/Button'
import { ClockIcon, GymIcon, NoteIcon, TrashIcon } from '../ui/Icons'
import styles from './GymForm.module.css'

/* ---------- Esercizio della scheda: aggiungi o modifica ---------- */

interface PlanExerciseSheetProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  /** Voce da modificare; se assente si aggiunge. */
  value?: PlanExercise
  /** Esercizi gia' presenti nel giorno (per non proporli due volte). */
  usedIds: number[]
  onSave: (value: PlanExercise) => void
  onRemove?: () => void
}

const str = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','))

export function PlanExerciseSheet({ open, onClose, exercises, value, usedIds, onSave, onRemove }: PlanExerciseSheetProps) {
  const [exerciseId, setExerciseId] = useState<number | undefined>()
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState('')
  const [rest, setRest] = useState('')
  const [note, setNote] = useState('')
  const [newName, setNewName] = useState('')
  const editing = value !== undefined
  const exercise = exercises.find((e) => e.id === exerciseId)
  const time = exercise?.mode === 'time'

  useEffect(() => {
    if (!open) return
    setExerciseId(value?.exerciseId)
    setSets(str(value?.sets ?? 3))
    setReps(str(value?.reps ?? 10))
    setWeight(str(value?.weightKg))
    setRir(str(value?.rir))
    setRest(str(value?.restSec))
    setNote(value?.note ?? '')
    setNewName('')
  }, [open, value])

  const available = exercises.filter((e) => !e.archived && (!usedIds.includes(e.id!) || e.id === value?.exerciseId))

  const createExercise = async () => {
    const name = newName.trim()
    if (!name) return
    const sortOrder = exercises.reduce((m, e) => Math.max(m, e.sortOrder), -1) + 1
    const id = (await db.exercises.add({ name, mode: 'reps', sortOrder })) as number
    setExerciseId(id)
    setNewName('')
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (exerciseId === undefined) return toast('Scegli un esercizio', 'error')
    const s = parseNum(sets)
    const r = parseNum(reps)
    const w = parseNum(weight)
    const ri = parseNum(rir)
    const re = parseNum(rest)
    if (s === undefined || s < 1 || s > 30) return toast('Serie da 1 a 30', 'error')
    if (r === undefined || r < 1 || r > 999) return toast(time ? 'Secondi da 1 a 999' : 'Ripetizioni da 1 a 999', 'error')
    if (weight.trim() && (w === undefined || w < 0 || w > 500)) return toast('Carico non valido', 'error')
    if (rir.trim() && (ri === undefined || ri < 0 || ri > 10)) return toast('RIR da 0 a 10', 'error')
    if (rest.trim() && (re === undefined || re < 5 || re > 1800)) return toast('Recupero da 5 a 1800 secondi', 'error')
    onSave({
      exerciseId,
      sets: Math.round(s),
      reps: Math.round(r),
      weightKg: w && w > 0 ? w : undefined,
      rir: time ? undefined : ri,
      restSec: re ? Math.round(re) : undefined,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifica esercizio' : 'Aggiungi alla scheda'}>
      <form className="stack" onSubmit={save}>
        {!editing && (
          <div className="stack-sm">
            <span className="label">Esercizio</span>
            <div className={styles.chips}>
              {available.map((ex) => (
                <button key={ex.id} type="button" className={`${styles.chip} ${ex.id === exerciseId ? styles.chipActive : ''}`} onClick={() => setExerciseId(ex.id)}>
                  {ex.name}
                </button>
              ))}
            </div>
            <div className={styles.newRow}>
              <input
                className={styles.newInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Oppure un nuovo esercizio…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createExercise()
                  }
                }}
              />
              <Button size="sm" onClick={createExercise} disabled={!newName.trim()}>
                Crea
              </Button>
            </div>
          </div>
        )}
        {editing && (
          <p className={styles.entryName}>
            <GymIcon size={18} /> {exercise?.name ?? 'Esercizio'}
          </p>
        )}

        <div className={styles.entryGrid}>
          <label className={styles.mini}>
            <span className={styles.miniLabel}>Serie</span>
            <input className={styles.miniInput} inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} />
          </label>
          <label className={styles.mini}>
            <span className={styles.miniLabel}>{time ? 'Secondi' : 'Rip.'}</span>
            <input className={styles.miniInput} inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
          </label>
          <label className={styles.mini}>
            <span className={styles.miniLabel}>kg</span>
            <input className={styles.miniInput} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="–" />
          </label>
          {!time && (
            <label className={styles.mini}>
              <span className={styles.miniLabel}>RIR</span>
              <input className={styles.miniInput} inputMode="numeric" value={rir} onChange={(e) => setRir(e.target.value)} placeholder="–" />
            </label>
          )}
        </div>

        <Field label="Recupero tra le serie" icon={<ClockIcon size={18} />} suffix="s">
          <NumberInput value={rest} onChange={(e) => setRest(e.target.value)} placeholder="90" decimal={false} />
        </Field>

        <Field label="Nota" icon={<NoteIcon size={18} />}>
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. lento in discesa, fermo 1 s in basso" />
        </Field>

        <ActionPair type="submit" label={editing ? 'Salva' : 'Aggiungi'} />
        {editing && onRemove && (
          <Button
            variant="danger"
            icon={<TrashIcon size={18} />}
            onClick={() => {
              onRemove()
              onClose()
            }}
            full
          >
            Togli dalla scheda
          </Button>
        )}
      </form>
    </Sheet>
  )
}

/* ---------- Nome (scheda o giorno) ---------- */

interface NameSheetProps {
  open: boolean
  onClose: () => void
  title: string
  label: string
  value: string
  onSave: (name: string) => void
  onRemove?: () => void
  removeLabel?: string
}

export function NameSheet({ open, onClose, title, label, value, onSave, onRemove, removeLabel }: NameSheetProps) {
  const [name, setName] = useState(value)
  useEffect(() => {
    if (open) setName(value)
  }, [open, value])

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast('Inserisci un nome', 'error')
    onSave(name.trim())
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <form className="stack" onSubmit={save}>
        <Field label={label} icon={<NoteIcon size={18} />}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <ActionPair type="submit" label="Salva" />
        {onRemove && (
          <Button
            variant="danger"
            icon={<TrashIcon size={18} />}
            onClick={() => {
              onRemove()
              onClose()
            }}
            full
          >
            {removeLabel ?? 'Elimina'}
          </Button>
        )}
      </form>
    </Sheet>
  )
}
