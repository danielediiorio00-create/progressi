import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../../db/db'
import type { Run, RunType } from '../../db/types'
import { todayISO } from '../../lib/date'
import { fmtNum, fmtPace, parseNum } from '../../lib/format'
import { paceSecPerKm, speedKmh } from '../../lib/running'
import { toast } from '../../hooks/useToast'
import { Sheet } from '../ui/Sheet'
import { Field, NumberInput, TextArea, TextInput } from '../ui/Field'
import { DurationInput, durationFromParts, partsFromDuration } from '../ui/DurationInput'
import { RatingPicker, Segmented } from '../ui/Controls'
import { ActionPair, Button } from '../ui/Button'
import { CalendarIcon, ClockIcon, HeartIcon, NoteIcon, RouteIcon, TrashIcon } from '../ui/Icons'
import styles from './RunForm.module.css'

interface RunFormProps {
  open: boolean
  onClose: () => void
  /** Corsa da modificare; se assente si crea una nuova corsa. */
  run?: Run
  /** Ultima corsa: usata per proporre il tipo. */
  last?: Run
}

interface FormState {
  date: string
  distance: string
  min: string
  sec: string
  type: RunType
  feeling?: number
  hr: string
  notes: string
}

const empty = (type: RunType): FormState => ({ date: todayISO(), distance: '', min: '', sec: '', type, hr: '', notes: '' })

/** Modulo di inserimento/modifica di una corsa, con passo e velocita' calcolati in tempo reale. */
export function RunForm({ open, onClose, run, last }: RunFormProps) {
  const [f, setF] = useState<FormState>(() => empty(last?.type ?? 'outdoor'))
  const editing = run?.id !== undefined

  useEffect(() => {
    if (!open) return
    if (run) {
      const [min, sec] = partsFromDuration(run.durationSec)
      setF({
        date: run.date,
        distance: String(run.distanceKm).replace('.', ','),
        min,
        sec,
        type: run.type,
        feeling: run.feeling,
        hr: run.avgHr ? String(run.avgHr) : '',
        notes: run.notes ?? '',
      })
    } else {
      setF(empty(last?.type ?? 'outdoor'))
    }
  }, [open, run, last])

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  // Anteprima: passo e velocita' mentre si scrive.
  const km = parseNum(f.distance)
  const durationSec = durationFromParts(f.min, f.sec)
  const pace = km && durationSec ? paceSecPerKm(km, durationSec) : undefined
  const speed = km && durationSec ? speedKmh(km, durationSec) : undefined

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.date) return toast('Inserisci la data', 'error')
    if (km === undefined || km <= 0 || km > 200) return toast('Distanza non valida', 'error')
    if (durationSec === null) return toast('Durata non valida (minuti e secondi)', 'error')
    if (!f.feeling) return toast('Scegli la sensazione da 1 a 10', 'error')
    const hr = parseNum(f.hr)
    if (f.hr.trim() !== '' && (hr === undefined || hr < 40 || hr > 240)) return toast('Frequenza cardiaca non valida', 'error')

    const record: Run = {
      date: f.date,
      distanceKm: Math.round(km * 100) / 100,
      durationSec,
      type: f.type,
      feeling: f.feeling,
      avgHr: hr !== undefined ? Math.round(hr) : undefined,
      notes: f.notes.trim() || undefined,
    }
    if (editing) {
      await db.runs.update(run!.id!, record)
      toast('Corsa aggiornata', 'success')
    } else {
      await db.runs.add(record)
      toast('Corsa salvata', 'success')
    }
    onClose()
  }

  const remove = async () => {
    if (!editing) return
    if (!window.confirm('Eliminare questa corsa?')) return
    await db.runs.delete(run!.id!)
    toast('Corsa eliminata')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifica corsa' : 'Nuova corsa'}>
      <form className="stack" onSubmit={save}>
        <Field label="Data" icon={<CalendarIcon size={18} />}>
          <TextInput type="date" value={f.date} onChange={set('date')} max={todayISO()} required />
        </Field>

        <div className="grid-2">
          <Field label="Distanza" icon={<RouteIcon size={18} />} suffix="km">
            <NumberInput value={f.distance} onChange={set('distance')} placeholder="5,0" autoFocus={!editing} />
          </Field>
          <Field label="Durata" icon={<ClockIcon size={18} />}>
            <DurationInput minutes={f.min} seconds={f.sec} onChange={(min, sec) => setF((s) => ({ ...s, min, sec }))} />
          </Field>
        </div>

        <p className={styles.preview} aria-live="polite">
          {pace && speed ? (
            <>
              Passo <strong>{fmtPace(pace, true)}</strong> · velocità <strong>{fmtNum(speed, 1)} km/h</strong>
            </>
          ) : (
            'Passo e velocità si calcolano da soli'
          )}
        </p>

        <Segmented
          ariaLabel="Tipo di corsa"
          value={f.type}
          onChange={(type) => setF((s) => ({ ...s, type }))}
          options={[
            { value: 'outdoor', label: 'Esterno' },
            { value: 'treadmill', label: 'Tapis roulant' },
          ]}
        />

        <div className="stack-sm">
          <span className="label">Sensazione (1 pessima · 10 ottima)</span>
          <RatingPicker label="Sensazione" value={f.feeling} onChange={(feeling) => setF((s) => ({ ...s, feeling }))} />
        </div>

        <Field label="FC media" icon={<HeartIcon size={18} />} suffix="bpm" hint="Facoltativa: non compare nella dashboard.">
          <NumberInput value={f.hr} onChange={set('hr')} placeholder="–" decimal={false} />
        </Field>

        <Field label="Note" icon={<NoteIcon size={18} />}>
          <TextArea value={f.notes} onChange={set('notes')} placeholder="Facoltative: percorso, meteo, dolori..." />
        </Field>

        <ActionPair type="submit" label={editing ? 'Salva modifiche' : 'Salva'} />
        {editing && (
          <Button variant="danger" icon={<TrashIcon size={18} />} onClick={remove} full>
            Elimina
          </Button>
        )}
      </form>
    </Sheet>
  )
}
