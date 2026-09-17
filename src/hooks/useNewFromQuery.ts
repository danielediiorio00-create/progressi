import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Apre subito il modulo "nuovo" se l'URL contiene ?nuova (scorciatoie della
 * dashboard: /corsa?nuova, /palestra?nuova, /corpo?nuova). Il parametro viene
 * poi rimosso dall'URL, cosi' un ricaricamento non riapre il modulo.
 */
export function useNewFromQuery(open: () => void) {
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (!params.has('nuova')) return
    open()
    setParams({}, { replace: true })
  }, [params, setParams, open])
}
