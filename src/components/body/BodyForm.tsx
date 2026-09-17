import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../../db/db'
import type { BodyEntry } from '../../db/types'
import { todayISO } from '../../lib/date'
import { fmtNum, parseNum } from '../../lib/format'
import { toast } from '../../hooks/useToast'
import { Sheet } from '../ui/Sheet'
import { Field, NumberInput, TextArea, TextInput } from '../ui/Field'
import { ActionPair, Button } from '../ui/Button'
import { CalendarIcon, NoteIcon, RulerIcon, ScaleIcon, TrashIcon } from '../ui/Icons'

interface BodyFormProps {
  open: boolean
  onClose: () => void
  /** Voce da modificare; se assente si crea una nuova misurazione. */
  entry?: BodyEntry
  /** Ultima misurazione: i suoi valori compaiono come suggerimento nei campi vuoti. */
  last?: BodyEntry
}

interface FormState {
  date: string
  weight: string
  waist: string
  hips: string
  thigh: string
  arm: string
  notes: string
}

const empty = (): FormState => ({ date: todayISO(), weight: '', waist: '', hips: '', thigh: '', arm: '', notes: '' })

const str = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','))
const hint = (n: number | undefined) => (n === undefined ? undefined : fmtNum(n, 1))

/** Modulo di inserimento/modifica di una misurazione corporea. */
export function BodyForm({ open, onClose, entry, last }: BodyFormProps) {
  const [f, setF] = useState<FormState>(empty)
  const editing = entry?.id !== undefined

  // Ogni volta che il pannello si apre, riparte dai valori giusti.
  useEffect(() => {
    if (!open) return
    setF(
      entry
        ? {
            date: entry.date,
            weight: str(entry.weightKg),
            waist: str(entry.waistCm),
            hips: str(entry.hipsCm),
            thigh: str(entry.thighCm),
            arm: str(entry.armCm),
            notes: entry.notes ?? '',
          }
        : empty(),
    )
  }, [open, entry])

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  const inRange = (text: string, min: number, max: number, label: string): number | undefined | false => {
    const n = parseNum(text)
    if (text.trim() !== '' && n === undefined) {
      toast(`${label}: valore non valido`, 'error')
      return false
    }
    if (n !== undefined && (n < min || n > max)) {
      toast(`${label}: deve essere tra ${min} e ${max}`, 'error')
      return false
    }
    return n
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.date) return toast('Inserisci la data', 'error')
    const weightKg = inRange(f.weight, 20, 400, 'Peso')
    const waistCm = inRange(f.waist, 30, 250, 'Vita')
    const hipsCm = inRange(f.hips, 30, 250, 'Fianchi')
    const thighCm = inRange(f.thigh, 20, 150, 'Coscia')
    const armCm = inRange(f.arm, 10, 100, 'Braccio')
    if ([weightKg, waistCm, hipsCm, thighCm, armCm].includes(false)) return
    const values = { weightKg, waistCm, hipsCm, thighCm, armCm } as Omit<BodyEntry, 'id' | 'date' | 'notes'>
    if (Object.values(values).every((v) => v === undefined)) return toast('Inserisci almeno una misura', 'error')

    const record: BodyEntry = { ...values, date: f.date, notes: f.notes.trim() || undefined }
    if (editing) {
      await db.body.update(entry!.id!, record)
      toast('Misurazione aggiornata', 'success')
    } else {
      await db.body.add(record)
      toast('Misurazione salvata', 'success')
    }
    onClose()
  }

  const remove = async () => {
    if (!editing) return
    if (!window.confirm('Eliminare questa misurazione?')) return
    await db.body.delete(entry!.id!)
    toast('Misurazione eliminata')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Modifica misurazione' : 'Nuova misurazione'}>
      <form className="stack" onSubmit={save}>
        <Field label="Data" icon={<CalendarIcon size={18} />}>
          <TextInput type="date" value={f.date} onChange={set('date')} max={todayISO()} required />
        </Field>

        <Field label="Peso" icon={<ScaleIcon size={18} />} suffix="kg">
          <NumberInput value={f.weight} onChange={set('weight')} placeholder={hint(last?.weightKg) ?? '72,5'} autoFocus={!editing} />
        </Field>

        <div className="grid-2">
          <Field label="Vita" icon={<RulerIcon size={18} />} suffix="cm">
            <NumberInput value={f.waist} onChange={set('waist')} placeholder={hint(last?.waistCm) ?? '–'} />
          </Field>
          <Field label="Fianchi" suffix="cm">
            <NumberInput value={f.hips} onChange={set('hips')} placeholder={hint(last?.hipsCm) ?? '–'} />
          </Field>
          <Field label="Coscia" suffix="cm">
            <NumberInput value={f.thigh} onChange={set('thigh')} placeholder={hint(last?.thighCm) ?? '–'} />
          </Field>
          <Field label="Braccio" suffix="cm">
            <NumberInput value={f.arm} onChange={set('arm')} placeholder={hint(last?.armCm) ?? '–'} />
          </Field>
        </div>

        <Field label="Note" icon={<NoteIcon size={18} />}>
          <TextArea value={f.notes} onChange={set('notes')} placeholder="Facoltative: orario, sonno, come ti senti..." />
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
