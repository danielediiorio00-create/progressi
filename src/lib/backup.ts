import { db, SETTINGS_ID, defaultSettings } from '../db/db'
import type { BackupFile, Settings } from '../db/types'
import { todayISO } from './date'

/** Dopo quanti giorni senza backup mostrare il promemoria. */
export const BACKUP_REMINDER_DAYS = 14

/** Raccoglie tutte le tabelle in un unico oggetto JSON. */
export async function buildBackup(): Promise<BackupFile> {
  const [settings, body, runs, exercises, gym] = await Promise.all([
    db.settings.toArray(),
    db.body.toArray(),
    db.runs.toArray(),
    db.exercises.toArray(),
    db.gym.toArray(),
  ])
  return { app: 'progressi', version: 1, exportedAt: new Date().toISOString(), settings, body, runs, exercises, gym }
}

/**
 * Esporta il backup. Su iPhone usa il menu di condivisione (si puo' salvare
 * in File, iCloud, ecc.); altrove scarica il file JSON.
 * Restituisce true se l'esportazione e' andata a buon fine.
 */
export async function exportBackup(): Promise<boolean> {
  const data = await buildBackup()
  const json = JSON.stringify(data, null, 2)
  const fileName = `progressi-backup-${todayISO()}.json`
  const file = new File([json], fileName, { type: 'application/json' })

  let done = false
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup Progressi' })
      done = true
    } catch (err) {
      // L'utente ha annullato la condivisione: non e' un errore.
      if ((err as DOMException).name === 'AbortError') return false
      done = false
    }
  }
  if (!done) {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    done = true
  }
  await db.settings.update(SETTINGS_ID, { lastBackupAt: new Date().toISOString() })
  return done
}

function isBackupFile(x: unknown): x is BackupFile {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    o.app === 'progressi' &&
    Array.isArray(o.body) &&
    Array.isArray(o.runs) &&
    Array.isArray(o.exercises) &&
    Array.isArray(o.gym)
  )
}

/**
 * Importa un backup SOSTITUENDO tutti i dati presenti sul dispositivo.
 * Restituisce un riepilogo di cosa e' stato importato.
 */
export async function importBackup(file: File): Promise<{ body: number; runs: number; gym: number; exercises: number }> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }
  if (!isBackupFile(parsed)) throw new Error('Il file non è un backup di Progressi.')
  const data = parsed

  await db.transaction('rw', [db.settings, db.body, db.runs, db.exercises, db.gym], async () => {
    await Promise.all([db.settings.clear(), db.body.clear(), db.runs.clear(), db.exercises.clear(), db.gym.clear()])
    const settings: Settings = { ...defaultSettings(), ...(data.settings?.[0] ?? {}), id: SETTINGS_ID }
    await db.settings.put(settings)
    await db.body.bulkAdd(data.body)
    await db.runs.bulkAdd(data.runs)
    await db.exercises.bulkAdd(data.exercises)
    await db.gym.bulkAdd(data.gym)
  })

  return { body: data.body.length, runs: data.runs.length, gym: data.gym.length, exercises: data.exercises.length }
}

/** Cancella tutti i dati e ripristina le impostazioni iniziali. */
export async function resetAllData(): Promise<void> {
  await db.delete()
  await db.open()
}

/** True se e' passato troppo tempo dall'ultimo backup (o dal primo utilizzo). */
export function isBackupOverdue(settings: Settings | undefined, hasData: boolean): boolean {
  if (!settings || !hasData) return false
  const reference = settings.lastBackupAt ?? settings.firstUseAt
  const elapsedDays = (Date.now() - new Date(reference).getTime()) / 86_400_000
  return elapsedDays > BACKUP_REMINDER_DAYS
}
