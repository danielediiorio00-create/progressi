import { useEffect, useMemo, useState } from 'react'
import { db } from '../../db/db'
import type { Exercise, Plan, PlanDay } from '../../db/types'
import { matchExercise, parsePlanMarkdown } from '../../lib/plan'
import { toast } from '../../hooks/useToast'
import { Sheet } from '../ui/Sheet'
import { Field, TextArea, TextInput } from '../ui/Field'
import { ActionPair } from '../ui/Button'
import { Chip } from '../ui/Controls'
import { ClipboardIcon, NoteIcon } from '../ui/Icons'
import styles from './PlanImportSheet.module.css'

interface PlanImportSheetProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  /** Scheda attuale: se esiste, verra' sostituita. */
  current?: Plan
  onImported?: () => void
}

const EXAMPLE = `# La mia scheda
## Giorno A
- Leg press 3x12 60 kg RIR 2
- Chest press 3x10 30 kg
- Plank 3x45 s
## Giorno B
- Goblet squat 3x10 16 kg
- Lat machine 3x12 35 kg RIR 2
- Pulley basso 3x12 30 kg`

/** Incolla una scheda in Markdown, controlla l'anteprima e importala. */
export function PlanImportSheet({ open, onClose, exercises, current, onImported }: PlanImportSheetProps) {
  const [text, setText] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!open) return
    setText('')
    setName('')
  }, [open])

  const parsed = useMemo(() => (text.trim() ? parsePlanMarkdown(text) : undefined), [text])

  // Per ogni esercizio letto: esistente (con id) oppure da creare.
  const resolved = useMemo(() => {
    if (!parsed) return []
    return parsed.days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({ ...e, match: matchExercise(e.name, exercises) })),
    }))
  }, [parsed, exercises])
  const newNames = [...new Set(resolved.flatMap((d) => d.exercises.filter((e) => !e.match).map((e) => e.name)))]

  const importPlan = async () => {
    if (!parsed || parsed.days.length === 0) return toast('Nessun esercizio riconosciuto', 'error')
    if (current && !window.confirm('Sostituire la scheda attuale con quella importata?')) return

    const created = new Map<string, number>()
    let sortOrder = exercises.reduce((m, e) => Math.max(m, e.sortOrder), -1) + 1
    const days: PlanDay[] = []
    for (const d of resolved) {
      const list = []
      for (const e of d.exercises) {
        let id = e.match?.id
        if (id === undefined) {
          const key = e.name.toLowerCase()
          id = created.get(key)
          if (id === undefined) {
            id = (await db.exercises.add({ name: e.name, mode: e.time ? 'time' : 'reps', sortOrder: sortOrder++ })) as number
            created.set(key, id)
          }
        }
        list.push({ exerciseId: id, sets: e.sets, reps: e.reps, weightKg: e.weightKg, rir: e.rir })
      }
      days.push({ name: d.name, exercises: list })
    }
    const now = new Date().toISOString()
    const plan: Plan = { name: name.trim() || parsed.name || 'La mia scheda', days, createdAt: now, updatedAt: now }
    if (current?.id !== undefined) await db.plans.delete(current.id)
    await db.plans.add(plan)
    toast(`Scheda importata: ${days.length} ${days.length === 1 ? 'giorno' : 'giorni'}${newNames.length ? `, ${newNames.length} esercizi nuovi` : ''}`, 'success', 3500)
    onImported?.()
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Importa scheda da Markdown">
      <div className="stack">
        <p className="muted small">
          Incolla la scheda: un titolo per ogni giorno e una riga per esercizio, tipo «Leg press 3x12 60 kg RIR 2». Vanno bene
          anche elenchi puntati e tabelle.{' '}
          <button type="button" className={styles.linkBtn} onClick={() => setText(EXAMPLE)}>
            Inserisci un esempio
          </button>
        </p>
        <Field label="Testo della scheda" icon={<ClipboardIcon size={18} />}>
          <TextArea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={'## Giorno A\n- Leg press 3x12 60 kg\n- ...'} autoFocus />
        </Field>
        <Field label="Nome scheda" icon={<NoteIcon size={18} />}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={parsed?.name ?? 'La mia scheda'} />
        </Field>

        {parsed && (
          <div className={styles.preview}>
            <span className="label">Anteprima</span>
            {resolved.map((d) => (
              <div key={d.name} className={styles.day}>
                <p className={styles.dayName}>{d.name}</p>
                <ul className={styles.list}>
                  {d.exercises.map((e, i) => (
                    <li key={i} className={styles.row}>
                      <span className={styles.exName}>{e.match?.name ?? e.name}</span>
                      <span className={styles.exMeta}>
                        {e.sets}×{e.reps}
                        {e.time ? ' s' : ''}
                        {e.weightKg ? ` · ${e.weightKg} kg` : ''}
                        {e.rir !== undefined ? ` · RIR ${e.rir}` : ''}
                      </span>
                      {!e.match && <Chip tone="accent">nuovo</Chip>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {parsed.warnings.map((w) => (
              <p key={w} className={styles.warning}>
                {w}
              </p>
            ))}
          </div>
        )}

        <ActionPair label={current ? 'Sostituisci la scheda' : 'Importa la scheda'} onClick={importPlan} disabled={!parsed || parsed.days.length === 0} />
      </div>
    </Sheet>
  )
}
