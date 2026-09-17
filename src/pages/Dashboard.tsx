import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { toast } from '../hooks/useToast'
import { exportBackup, isBackupOverdue, BACKUP_REMINDER_DAYS } from '../lib/backup'
import { sortByDate, measureSummary, weightSummary } from '../lib/body'
import { formatDate, formatRelativeDay, todayISO } from '../lib/date'
import { fmtNum, fmtSigned } from '../lib/format'
import { goalStreak, greeting, latestRecords, weekProgress } from '../lib/dashboard'
import { Card } from '../components/ui/Card'
import { HeaderButton, PageHeader } from '../components/ui/PageHeader'
import { Sun } from '../components/ui/Sun'
import { Metric } from '../components/ui/Metric'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Controls'
import { List, ListRow } from '../components/ui/ListRow'
import { ArrowRightIcon, BodyIcon, DownloadIcon, GymIcon, RunIcon, SettingsIcon } from '../components/ui/Icons'
import styles from './Dashboard.module.css'

export function DashboardPage() {
  const settings = useSettings()
  const runs = useLiveQuery(() => db.runs.toArray(), [])
  const gym = useLiveQuery(() => db.gym.toArray(), [])
  const body = useLiveQuery(() => db.body.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [busy, setBusy] = useState(false)

  const loaded = settings && runs && gym && body && exercises
  const week = useMemo(() => (loaded ? weekProgress(runs, gym, settings) : undefined), [loaded, runs, gym, settings])
  const streak = useMemo(() => (loaded ? goalStreak(runs, gym, settings) : 0), [loaded, runs, gym, settings])
  const records = useMemo(() => (loaded ? latestRecords(runs, gym, exercises) : []), [loaded, runs, gym, exercises])
  const sortedBody = useMemo(() => sortByDate(body ?? []), [body])
  const weight = useMemo(() => weightSummary(sortedBody), [sortedBody])
  const waist = useMemo(() => measureSummary(sortedBody, 'waistCm'), [sortedBody])

  const total = (runs?.length ?? 0) + (gym?.length ?? 0) + (body?.length ?? 0)
  const overdue = isBackupOverdue(settings, total > 0)
  const today = formatDate(todayISO(), 'long')
  const eyebrow = today.charAt(0).toUpperCase() + today.slice(1)

  const onExport = async () => {
    setBusy(true)
    try {
      if (await exportBackup()) toast('Backup esportato', 'success')
    } catch {
      toast('Esportazione non riuscita', 'error')
    } finally {
      setBusy(false)
    }
  }

  const missingRuns = week ? Math.max(0, week.runTarget - week.runs) : 0
  const missingGym = week ? Math.max(0, week.gymTarget - week.gym) : 0
  const missing = [missingRuns > 0 ? `${missingRuns} ${missingRuns === 1 ? 'corsa' : 'corse'}` : '', missingGym > 0 ? `${missingGym} palestra` : '']
    .filter(Boolean)
    .join(' e ')

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={`${greeting()}!`}
        actions={
          <HeaderButton to="/impostazioni" label="Impostazioni">
            <SettingsIcon size={20} />
          </HeaderButton>
        }
      />

      <div className="stack">
        {/* ---- Promemoria backup ---- */}
        {overdue && (
          <Card variant="glass" compact className={styles.banner}>
            <div className={styles.bannerBody}>
              <Chip tone="warn">Backup</Chip>
              <p className="small">
                {settings?.lastBackupAt ? `Sono passati più di ${BACKUP_REMINDER_DAYS} giorni dall'ultimo backup.` : `Non hai ancora esportato un backup.`}{' '}
                I dati vivono solo su questo telefono.
              </p>
            </div>
            <Button size="sm" icon={<DownloadIcon size={16} />} onClick={onExport} disabled={busy}>
              Esporta
            </Button>
          </Card>
        )}

        {/* ---- Settimana (in evidenza) ---- */}
        <Card variant="dark" className={styles.hero}>
          <Sun size={150} top={-50} right={-40} />
          <div className={styles.heroBody}>
            <div className="row-between">
              <span className="label">Questa settimana</span>
              {week?.met && <Chip tone="good">obiettivo raggiunto</Chip>}
            </div>
            <div className={styles.heroNumbers}>
              <div className={styles.goal}>
                <Metric value={week?.runs ?? 0} unit={`/ ${week?.runTarget ?? settings?.weeklyRunTarget ?? 3}`} label="corse" size="hero" />
                <div className={styles.bar}>
                  <span style={{ width: `${week && week.runTarget > 0 ? Math.min(100, (week.runs / week.runTarget) * 100) : 0}%` }} />
                </div>
              </div>
              <div className={styles.goal}>
                <Metric value={week?.gym ?? 0} unit={`/ ${week?.gymTarget ?? settings?.weeklyGymTarget ?? 2}`} label="palestra" size="hero" />
                <div className={styles.bar}>
                  <span style={{ width: `${week && week.gymTarget > 0 ? Math.min(100, (week.gym / week.gymTarget) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
            <div className={styles.heroFoot}>
              <Metric label="Settimane di fila" value={streak} unit="a obiettivo" size="sm" />
              <p className={styles.heroText}>{week?.met ? 'Settimana completa: bel lavoro.' : missing ? `Ti mancano ${missing}.` : 'Imposta un obiettivo nelle impostazioni.'}</p>
            </div>
          </div>
        </Card>

        {/* ---- Inserimento rapido ---- */}
        <div className={styles.quick}>
          <Link to="/corsa?nuova" className={styles.quickBtn}>
            <RunIcon size={18} /> Corsa
          </Link>
          <Link to="/palestra?nuova" className={styles.quickBtn}>
            <GymIcon size={18} /> Palestra
          </Link>
          <Link to="/corpo?nuova" className={styles.quickBtn}>
            <BodyIcon size={18} /> Peso
          </Link>
        </div>

        {/* ---- Dall'inizio ---- */}
        <Card variant="glass">
          <div className="stack-sm">
            <div className="row-between">
              <h2>Dall'inizio</h2>
              {sortedBody[0] && <span className="muted small">dal {formatDate(sortedBody[0].date, 'short')}</span>}
            </div>
            {sortedBody.length === 0 ? (
              <p className="muted small">
                Registra peso e vita in <Link to="/corpo">Corpo</Link>: qui vedrai la variazione della media settimanale.
              </p>
            ) : (
              <div className="grid-2">
                <Metric
                  label="Peso medio"
                  value={weight.deltaStart !== undefined ? fmtSigned(weight.deltaStart, 1) : '–'}
                  unit={weight.deltaStart !== undefined ? 'kg' : undefined}
                  size="lg"
                  delta={weight.deltaStart === undefined ? 'serve almeno una settimana' : `ora ${fmtNum(weight.avg7, 1)} kg`}
                  deltaTone="neutral"
                />
                <Metric
                  label="Vita"
                  value={waist.delta !== undefined ? fmtSigned(waist.delta, 1) : '–'}
                  unit={waist.delta !== undefined ? 'cm' : undefined}
                  size="lg"
                  delta={waist.delta === undefined ? (waist.latest ? 'serve una seconda misura' : 'nessuna misura') : `ora ${fmtNum(waist.latest, 1)} cm`}
                  deltaTone="neutral"
                />
              </div>
            )}
          </div>
        </Card>

        {/* ---- Record ---- */}
        <Card compact>
          <div className="stack-sm">
            <List title="Ultimi record">
              {records.map((r, i) => (
                <ListRow
                  key={`${r.date}-${r.title}-${i}`}
                  title={r.title}
                  meta={`${formatRelativeDay(r.date)}${r.detail ? ` · ${r.detail}` : ''}`}
                  aside={<Chip tone="accent">{r.kind === 'run' ? 'corsa' : 'palestra'}</Chip>}
                  value={r.value}
                />
              ))}
            </List>
            {loaded && records.length === 0 && (
              <p className="muted small" style={{ padding: '0 8px 8px' }}>
                I record compaiono quando superi un tuo massimo: distanza, passo, tempo o carico.
              </p>
            )}
          </div>
        </Card>

        {loaded && total === 0 && (
          <Card>
            <div className="stack-sm">
              <h2>Da dove iniziare</h2>
              <p className="muted small">
                1. Compila altezza e obiettivo nelle impostazioni. 2. Registra il peso di oggi. 3. Dopo ogni allenamento, aggiungilo con i
                pulsanti qui sopra: bastano 20 secondi.
              </p>
              <Link to="/impostazioni" className={styles.link}>
                Vai alle impostazioni <ArrowRightIcon size={18} />
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
