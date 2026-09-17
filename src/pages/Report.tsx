import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { toast } from '../hooks/useToast'
import { buildReport, type ReportDays } from '../lib/report'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button, IconButton } from '../components/ui/Button'
import { Segmented } from '../components/ui/Controls'
import { Field, TextArea } from '../components/ui/Field'
import { CopyIcon, NoteIcon, ShareIcon } from '../components/ui/Icons'
import styles from './Report.module.css'

const NOTES_KEY = 'progressi.reportNotes'
const DAYS_KEY = 'progressi.reportDays'

function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

/** Copia negli appunti anche senza HTTPS (in locale l'API moderna non e' disponibile). */
async function copyText(text: string, fallbackEl: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* si prova il metodo classico */
  }
  if (!fallbackEl) return false
  fallbackEl.value = text
  fallbackEl.focus()
  fallbackEl.select()
  fallbackEl.setSelectionRange(0, text.length)
  const ok = document.execCommand('copy')
  fallbackEl.blur()
  return ok
}

export function ReportPage() {
  const settings = useSettings()
  const body = useLiveQuery(() => db.body.toArray(), [])
  const runs = useLiveQuery(() => db.runs.toArray(), [])
  const gym = useLiveQuery(() => db.gym.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [days, setDays] = useState<ReportDays>(() => (Number(readStored(DAYS_KEY, '30')) as ReportDays) || 30)
  const [notes, setNotes] = useState(() => readStored(NOTES_KEY, ''))
  const hiddenRef = useRef<HTMLTextAreaElement>(null)
  const canShare = typeof navigator.share === 'function'

  // Note e periodo restano memorizzati sul dispositivo tra una visita e l'altra.
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, notes)
      localStorage.setItem(DAYS_KEY, String(days))
    } catch {
      /* ignora */
    }
  }, [notes, days])

  const loaded = settings && body && runs && gym && exercises
  const text = useMemo(
    () => (loaded ? buildReport({ settings, body, runs, gym, exercises, days, notes }) : ''),
    [loaded, settings, body, runs, gym, exercises, days, notes],
  )

  const onCopy = async () => {
    const ok = await copyText(text, hiddenRef.current)
    toast(ok ? 'Report copiato negli appunti' : 'Copia non riuscita: seleziona il testo a mano', ok ? 'success' : 'error', 3000)
  }

  const onShare = async () => {
    try {
      await navigator.share({ title: `Report allenamento · ${days} giorni`, text })
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') toast('Condivisione non riuscita', 'error')
    }
  }

  return (
    <>
      <PageHeader title="Report" eyebrow="Per il coach" subtitle="Un riepilogo in Markdown da incollare in una chat con Claude." />

      <div className="stack">
        <Card variant="glass">
          <div className="stack-sm">
            <span className="label">Periodo</span>
            <Segmented
              ariaLabel="Periodo del report"
              value={String(days)}
              onChange={(v) => setDays(Number(v) as ReportDays)}
              options={[
                { value: '7', label: '7 giorni' },
                { value: '30', label: '30 giorni' },
                { value: '90', label: '90 giorni' },
              ]}
            />
            <Field label="Note per il coach" icon={<NoteIcon size={18} />} hint="Come ti senti, dolori, sonno, tempo disponibile la prossima settimana.">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Es. dormo 6 ore, ginocchio sinistro un po' dolente in discesa, la prossima settimana ho 3 sere libere" />
            </Field>
          </div>
        </Card>

        <div className={styles.actions}>
          <Button icon={<CopyIcon size={18} />} onClick={onCopy} full disabled={!loaded}>
            Copia tutto
          </Button>
          {canShare && (
            <IconButton label="Condividi" onClick={onShare} disabled={!loaded}>
              <ShareIcon size={20} />
            </IconButton>
          )}
        </div>
        {!canShare && <p className={`muted small ${styles.hint}`}>Il menu di condivisione iOS è disponibile sul sito pubblicato (HTTPS).</p>}

        <Card>
          <div className="stack-sm">
            <div className="row-between">
              <h2>Anteprima</h2>
              <span className="muted small">{text.length > 0 ? `${text.split('\n').length} righe` : ''}</span>
            </div>
            <pre className={styles.preview}>{text}</pre>
          </div>
        </Card>

        <p className={`muted small ${styles.hint}`}>
          Suggerimento: incolla il report e chiedi «Analizza i progressi e proponi il piano della prossima settimana». La frequenza
          cardiaca non è inclusa.
        </p>
      </div>

      {/* Area nascosta usata solo per la copia con il metodo classico. */}
      <textarea ref={hiddenRef} className={styles.hidden} readOnly aria-hidden="true" tabIndex={-1} />
    </>
  )
}
