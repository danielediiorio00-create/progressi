import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'progressi.theme'
const THEME_COLORS = { light: '#EFE7DF', dark: '#1C1917' } as const

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function resolve(pref: ThemePreference): 'light' | 'dark' {
  if (pref !== 'auto') return pref
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(pref: ThemePreference) {
  const resolved = resolve(pref)
  document.documentElement.dataset.theme = resolved
  // Colora la barra di stato dell'iPhone in modo coerente col tema.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
}

/**
 * Preferenza tema: "auto" segue il sistema, "light"/"dark" la forzano.
 * La scelta e' salvata in localStorage (e' una preferenza del dispositivo,
 * non un dato personale, quindi non entra nel backup).
 */
export function useTheme(): [ThemePreference, (p: ThemePreference) => void] {
  const [pref, setPref] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    apply(pref)
    if (pref !== 'auto') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('auto')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const update = useCallback((p: ThemePreference) => {
    try {
      if (p === 'auto') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, p)
    } catch {
      /* localStorage non disponibile: il tema vale solo per la sessione */
    }
    setPref(p)
  }, [])

  return [pref, update]
}
