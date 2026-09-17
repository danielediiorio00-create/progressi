import Dexie, { type EntityTable } from 'dexie'
import type { BodyEntry, Exercise, GymSession, Plan, Run, Settings } from './types'
import { DEFAULT_EXERCISES } from './seed'

export const SETTINGS_ID = 1

/**
 * Database locale (IndexedDB tramite Dexie). Tutto resta sul dispositivo:
 * nessun dato viene inviato a server esterni.
 *
 * Le stringhe in `stores` elencano SOLO i campi indicizzati (usati per
 * ordinare e filtrare), non tutti i campi salvati.
 */
export const db = new Dexie('progressi') as Dexie & {
  settings: EntityTable<Settings, 'id'>
  body: EntityTable<BodyEntry, 'id'>
  runs: EntityTable<Run, 'id'>
  exercises: EntityTable<Exercise, 'id'>
  gym: EntityTable<GymSession, 'id'>
  plans: EntityTable<Plan, 'id'>
}

db.version(1).stores({
  settings: 'id',
  body: '++id, date',
  runs: '++id, date',
  exercises: '++id, sortOrder',
  gym: '++id, date',
})

// Versione 2: scheda di allenamento. Dexie aggiorna i database esistenti da solo.
db.version(2).stores({
  plans: '++id',
})

export function defaultSettings(): Settings {
  return {
    id: SETTINGS_ID,
    weeklyRunTarget: 3,
    weeklyGymTarget: 2,
    firstUseAt: new Date().toISOString(),
  }
}

// Eseguito una sola volta, quando il database viene creato sul dispositivo.
db.on('populate', () => {
  db.settings.add(defaultSettings())
  db.exercises.bulkAdd(DEFAULT_EXERCISES.map((e, i) => ({ ...e, sortOrder: i })))
})
