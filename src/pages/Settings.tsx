import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'
import { toast } from '../hooks/useToast'
import { exportBackup, importBackup, isBackupOverdue, resetAllData, BACKUP_REMINDER_DAYS } from '../lib/backup'
import { formatDateTime } from '../lib/date'
import { parseNum } from '../lib/format'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Field, NumberInput, TextArea } from '../components/ui/Field'
import { ActionPair, Button } from '../components/ui/Button'
import { Segmented, Stepper } from '../components/ui/Controls'
import { CalendarIcon, DownloadIcon, MoonIcon, RulerIcon, SunIcon, TargetIcon, UploadIcon } from '../components/ui/Icons'
import styles from './Settings.module.css'

export function SettingsPage() {
  const settings = useSettings()
  const [theme, setTheme] = useTheme()

  // Conteggio voci: serve per il promemoria backup e per il riepilogo.
  const counts = useLiveQuery(async () => {
    const [body, runs, gym] = await Promise.all([db.body.count(), db.runs.count(), db.gym.count()])
    return { body, runs, gym, total: body + runs + gym }
  }, [])

  // --- Profilo (modulo con salvataggio esplicito) ---
  const [height, setHeight] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [goal, setGoal] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!settings || loaded) return
    setHeight(settings.heightCm ? String(settings.heightCm) : '')
    setBirthYear(settings.birthYear ? String(settings.birthYear) : '')
    setGoal(settings.goalText ?? '')
    setLoaded(true)
  }, [settings, loaded])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    const h = parseNum(height)
    const y = parseNum(birthYear)
    if (height && (h === undefined || h < 100 || h > 250)) return toast('Altezza non valida (100–250 cm)', 'error')
    if (birthYear && (y === undefined || y < 1920 || y > new Date().getFullYear())) return toast('Anno di nascita non valido', 'error')
    await updateSettings({ heightCm: h, birthYear: y, goalText: goal.trim() || undefined })
    toast('Profilo salvato', 'success')
  }

  // --- Backup ---
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onExport = async () => {
    setBusy(true)
    try {
      const ok = await exportBackup()
      if (ok) toast('Backup esportato', 'success')
    } catch {
      toast('Esportazione non riuscita', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    const confirmed = window.confirm(
      'Importare il backup? TUTTI i dati presenti su questo dispositivo verranno sostituiti da quelli del file.',
    )
    if (!confirmed) return
    setBusy(true)
    try {
      const r = await importBackup(file)
      toast(`Importati ${r.body} pesate, ${r.runs} corse, ${r.gym} sedute`, 'success', 3500)
      setLoaded(false) // ricarica il modulo profilo con i nuovi valori
    } catch (err) {
      toast((err as Error).message || 'Importazione non riuscita', 'error', 3500)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onReset = async () => {
    if (!window.confirm('Cancellare TUTTI i dati? Questa operazione non si può annullare.')) return
    if (!window.confirm('Ultima conferma: vuoi davvero cancellare tutto?')) return
    await resetAllData()
    setLoaded(false)
    toast('Dati cancellati')
  }

  const overdue = isBackupOverdue(settings, (counts?.total ?? 0) > 0)

  return (
    <>
      <PageHeader title="Impostazioni" backTo="/" />

      <div className="stack">
        {/* ---------- Profilo ---------- */}
        <Card variant="glass">
          <form className="stack" onSubmit={saveProfile}>
            <h2>Profilo</h2>
            <div className="grid-2">
              <Field label="Altezza" icon={<RulerIcon size={18} />} suffix="cm">
                <NumberInput value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" decimal={false} />
              </Field>
              <Field label="Nato nel" icon={<CalendarIcon size={18} />}>
                <NumberInput value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1995" decimal={false} />
              </Field>
            </div>
            <Field label="Obiettivo" icon={<TargetIcon size={18} />} hint="In parole tue: comparirà nel report per il coach.">
              <TextArea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Es. correre 5 km senza fermarmi e perdere 4 kg" />
            </Field>
            <ActionPair type="submit" label="Salva profilo" />
          </form>
        </Card>

        {/* ---------- Obiettivo settimanale ---------- */}
        <Card>
          <div className="stack-sm">
            <h2>Obiettivo settimanale</h2>
            <p className="muted small">Quante sedute vuoi fare ogni settimana. La dashboard confronta i tuoi allenamenti con questo obiettivo.</p>
            <Stepper
              label="Corse"
              unit="a settimana"
              value={settings?.weeklyRunTarget ?? 3}
              min={0}
              max={7}
              onChange={(v) => updateSettings({ weeklyRunTarget: v })}
            />
            <div className={styles.divider} />
            <Stepper
              label="Palestra"
              unit="a settimana"
              value={settings?.weeklyGymTarget ?? 2}
              min={0}
              max={7}
              onChange={(v) => updateSettings({ weeklyGymTarget: v })}
            />
          </div>
        </Card>

        {/* ---------- Aspetto ---------- */}
        <Card>
          <div className="stack-sm">
            <h2>Aspetto</h2>
            <Segmented
              ariaLabel="Tema"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'auto', label: 'Automatico' },
                { value: 'light', label: (<><SunIcon size={16} /> Chiaro</>) },
                { value: 'dark', label: (<><MoonIcon size={16} /> Scuro</>) },
              ]}
            />
          </div>
        </Card>

        {/* ---------- Backup ---------- */}
        <Card variant={overdue ? 'dark' : 'solid'}>
          <div className="stack-sm">
            <h2>Backup</h2>
            <p className={overdue ? styles.onDark : 'muted small'}>
              I dati vivono solo su questo telefono: se lo perdi o cancelli il sito, spariscono. Esporta un backup ogni tanto e
              salvalo in File o iCloud.
            </p>
            <p className={`small ${overdue ? styles.onDark : 'muted'}`}>
              {settings?.lastBackupAt
                ? `Ultimo backup: ${formatDateTime(settings.lastBackupAt)}`
                : 'Nessun backup ancora esportato.'}
              {overdue && ` Sono passati più di ${BACKUP_REMINDER_DAYS} giorni.`}
              {counts && counts.total > 0 && ` · ${counts.body} pesate, ${counts.runs} corse, ${counts.gym} sedute`}
            </p>
            <div className={styles.actions}>
              <Button variant={overdue ? 'accent' : 'primary'} icon={<DownloadIcon size={18} />} onClick={onExport} disabled={busy} full>
                Esporta backup
              </Button>
              <Button variant="secondary" icon={<UploadIcon size={18} />} onClick={() => fileRef.current?.click()} disabled={busy} full className={overdue ? styles.secondaryOnDark : ''}>
                Importa backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={(e) => onImportFile(e.target.files?.[0])}
              />
            </div>
          </div>
        </Card>

        {/* ---------- Zona pericolosa ---------- */}
        <Card variant="glass">
          <div className="stack-sm">
            <h2>Dati</h2>
            <p className="muted small">Cancella tutto e riparti da zero (gli esercizi tornano a quelli preimpostati).</p>
            <Button variant="danger" onClick={onReset} full>
              Cancella tutti i dati
            </Button>
          </div>
        </Card>

        <p className={styles.footer}>
          Progressi v{__APP_VERSION__} · Nessun dato lascia questo dispositivo.
        </p>
      </div>
    </>
  )
}
