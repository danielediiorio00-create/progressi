import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTINGS_ID, defaultSettings } from '../db/db'
import type { Settings } from '../db/types'

/**
 * Impostazioni "vive": il componente si aggiorna da solo quando cambiano.
 * Restituisce undefined durante il primo caricamento.
 */
export function useSettings(): Settings | undefined {
  return useLiveQuery(() => db.settings.get(SETTINGS_ID), [])
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = (await db.settings.get(SETTINGS_ID)) ?? defaultSettings()
  await db.settings.put({ ...current, ...patch, id: SETTINGS_ID })
}
