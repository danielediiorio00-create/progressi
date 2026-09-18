import { useCallback, useEffect, useRef, useState } from 'react'

type WakeLockSentinel = { release: () => Promise<void>; addEventListener: (t: 'release', cb: () => void) => void }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }

/**
 * Tiene lo schermo acceso (Screen Wake Lock API, iOS 16.4+) finche' e' attivo.
 * Viene richiesto di nuovo quando l'app torna in primo piano.
 */
export function useWakeLock(): { supported: boolean; active: boolean; toggle: () => void } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [active, setActive] = useState(false)
  const sentinel = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    try {
      const lock = await (navigator as WakeLockNavigator).wakeLock!.request('screen')
      sentinel.current = lock
      lock.addEventListener('release', () => {
        sentinel.current = null
      })
      return true
    } catch {
      return false
    }
  }, [])

  const toggle = useCallback(() => {
    if (!supported) return
    if (active) {
      void sentinel.current?.release()
      sentinel.current = null
      setActive(false)
    } else {
      void request().then((ok) => setActive(ok))
    }
  }, [active, request, supported])

  // iOS rilascia il blocco quando l'app va in secondo piano: lo si richiede al ritorno.
  useEffect(() => {
    if (!active) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel.current) void request()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel.current?.release()
      sentinel.current = null
    }
  }, [active, request])

  return { supported, active, toggle }
}
