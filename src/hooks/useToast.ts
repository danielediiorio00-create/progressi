import { useSyncExternalStore } from 'react'

/**
 * Notifiche brevi ("Salvato", "Eliminato"...) senza librerie esterne.
 * `toast()` si puo' chiamare ovunque; <Toaster/> nel layout le mostra.
 */

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'error'
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function toast(message: string, kind: Toast['kind'] = 'info', durationMs = 2200) {
  const id = nextId++
  toasts = [...toasts, { id, message, kind }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, durationMs)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, () => toasts)
}
