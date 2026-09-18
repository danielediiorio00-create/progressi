import { useCallback, useEffect, useRef, useState } from 'react'

export interface RestTimer {
  running: boolean
  done: boolean
  /** Secondi rimanenti. */
  remaining: number
  /** Durata impostata (secondi). */
  total: number
  /** Nome dell'esercizio a cui si riferisce, se noto. */
  label?: string
  start: (seconds: number, label?: string) => void
  /** Aggiunge o toglie secondi al timer in corso. */
  adjust: (delta: number) => void
  stop: () => void
  /** Chiude l'avviso "recupero finito". */
  dismiss: () => void
}

/** Breve doppio "bip" con la Web Audio API (funziona solo se il contesto e' stato creato da un tocco). */
function beep(ctx: AudioContext) {
  const now = ctx.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0, now + i * 0.22)
    gain.gain.linearRampToValueAtTime(0.25, now + i * 0.22 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.22 + 0.16)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.22)
    osc.stop(now + i * 0.22 + 0.18)
  }
}

/**
 * Timer di recupero tra le serie. Usa l'orario di fine (non un contatore),
 * cosi' resta preciso anche se il telefono rallenta o si blocca lo schermo.
 */
export function useRestTimer(): RestTimer {
  const [total, setTotal] = useState(0)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [done, setDone] = useState(false)
  const [label, setLabel] = useState<string | undefined>()
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (endsAt === null) return
    let id: number
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left > 0) {
        id = window.setTimeout(tick, 250)
        return
      }
      setEndsAt(null)
      setDone(true)
      try {
        navigator.vibrate?.([250, 120, 250, 120, 400])
      } catch {
        /* non supportato */
      }
      try {
        if (audio.current) beep(audio.current)
      } catch {
        /* audio non disponibile */
      }
    }
    tick()
    return () => window.clearTimeout(id)
  }, [endsAt])

  const start = useCallback((seconds: number, name?: string) => {
    // Il contesto audio va creato/riattivato dentro un tocco dell'utente (regola di iOS).
    try {
      audio.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      if (audio.current.state === 'suspended') void audio.current.resume()
    } catch {
      audio.current = null
    }
    const s = Math.max(5, Math.round(seconds))
    setTotal(s)
    setRemaining(s)
    setDone(false)
    setLabel(name)
    setEndsAt(Date.now() + s * 1000)
  }, [])

  const adjust = useCallback((delta: number) => {
    setEndsAt((e) => {
      if (e === null) return e
      const next = Math.max(Date.now() + 1000, e + delta * 1000)
      setTotal((t) => Math.max(5, t + delta))
      return next
    })
  }, [])

  const stop = useCallback(() => {
    setEndsAt(null)
    setDone(false)
    setRemaining(0)
  }, [])

  const dismiss = useCallback(() => setDone(false), [])

  return { running: endsAt !== null, done, remaining, total, label, start, adjust, stop, dismiss }
}
