import type { Exercise } from './types'

/** Esercizi preimpostati al primo avvio. Modificabili dalle impostazioni. */
export const DEFAULT_EXERCISES: Omit<Exercise, 'id' | 'sortOrder'>[] = [
  { name: 'Leg press', mode: 'reps' },
  { name: 'Goblet squat', mode: 'reps' },
  { name: 'Lat machine', mode: 'reps' },
  { name: 'Chest press', mode: 'reps' },
  { name: 'Pulley basso', mode: 'reps' },
  { name: 'Plank a tempo', mode: 'time' },
]
