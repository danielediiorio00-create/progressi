import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Apre subito il modulo "nuovo" se l'URL contiene ?nuova (scorciatoie della
 * dashboard: /corsa?nuova, /palestra?nuova&giorno=Giorno%20A, /corpo?nuova).
 * Il parametro viene poi rimosso dall'URL, cosi' un ricaricamento non riapre
 * il modulo. Alla callback arrivano gli altri parametri (es. "giorno").
 */
export function useNewFromQuery(open: (params: URLSearchParams) => void) {
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (!params.has('nuova')) return
    open(params)
    setParams({}, { replace: true })
  }, [params, setParams, open])
}

