/** Data in formato ISO "YYYY-MM-DD" (solo giorno, ora locale). */
export type ISODate = string

/** Impostazioni e profilo: una sola riga, con id sempre uguale a 1. */
export interface Settings {
  id: number
  heightCm?: number
  birthYear?: number
  /** Obiettivo dichiarato in parole (es. "perdere 5 kg e correre 5 km senza fermarmi"). */
  goalText?: string
  /** Obiettivo settimanale: numero di corse e di sedute in palestra. */
  weeklyRunTarget: number
  weeklyGymTarget: number
  /** Data/ora ISO dell'ultimo backup esportato. */
  lastBackupAt?: string
  /** Data/ora ISO del primo avvio: serve al promemoria backup. */
  firstUseAt: string
}

/** Metriche corporee: tutti i campi sono facoltativi tranne la data. */
export interface BodyEntry {
  id?: number
  date: ISODate
  weightKg?: number
  waistCm?: number
  hipsCm?: number
  thighCm?: number
  armCm?: number
  notes?: string
}

export type RunType = 'treadmill' | 'outdoor'

export interface Run {
  id?: number
  date: ISODate
  distanceKm: number
  durationSec: number
  type: RunType
  /** Sensazione da 1 (pessima) a 10 (ottima). */
  feeling: number
  notes?: string
  /** Frequenza cardiaca media, facoltativa. Non compare nella dashboard. */
  avgHr?: number
}

/** "reps" = serie x ripetizioni x carico; "time" = serie x secondi (es. plank). */
export type ExerciseMode = 'reps' | 'time'

export interface Exercise {
  id?: number
  name: string
  mode: ExerciseMode
  sortOrder: number
  /** Un esercizio archiviato non compare piu' tra le scelte ma resta nello storico. */
  archived?: boolean
}

/** Un esercizio dentro una sessione: tutte le serie uguali (inserimento rapido). */
export interface GymEntry {
  exerciseId: number
  sets: number
  /** Ripetizioni per serie, oppure secondi se l'esercizio e' "a tempo". */
  reps: number
  weightKg?: number
  /** Ripetizioni di scorta (RIR): quante ne restavano "nel serbatoio". */
  rir?: number
}

export interface GymSession {
  id?: number
  date: ISODate
  entries: GymEntry[]
  notes?: string
}

/** Struttura del file di backup JSON. */
export interface BackupFile {
  app: 'progressi'
  version: 1
  exportedAt: string
  settings: Settings[]
  body: BodyEntry[]
  runs: Run[]
  exercises: Exercise[]
  gym: GymSession[]
}
