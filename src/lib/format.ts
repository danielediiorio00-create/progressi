/** Formattazione di numeri, durate e passo in stile italiano. */

const formatters = new Map<number, Intl.NumberFormat>()

function nf(digits: number): Intl.NumberFormat {
  let f = formatters.get(digits)
  if (!f) {
    f = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: digits })
    formatters.set(digits, f)
  }
  return f
}

/** 72.4 -> "72,4" */
export function fmtNum(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '–'
  return nf(digits).format(n)
}

/** -0.8 -> "−0,8", 1.2 -> "+1,2", 0 -> "0" */
export function fmtSigned(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '–'
  const rounded = Number(n.toFixed(digits))
  if (rounded === 0) return '0'
  return (rounded > 0 ? '+' : '−') + nf(digits).format(Math.abs(rounded))
}

/** Secondi -> "mm:ss" oppure "h:mm:ss" oltre l'ora. */
export function fmtDuration(totalSec: number | undefined | null): string {
  if (totalSec === undefined || totalSec === null || !Number.isFinite(totalSec)) return '–'
  const s = Math.round(totalSec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** "32:15" o "1:02:30" -> secondi. Restituisce null se il testo non e' valido. */
export function parseDuration(text: string): number | null {
  const parts = text
    .trim()
    .replace(/[.,']/g, ':')
    .split(':')
    .map((p) => p.trim())
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => p === '' || !/^\d+$/.test(p))) return null
  const nums = parts.map(Number)
  const [a, b, c] = nums
  if (nums.length === 2) {
    if (b >= 60) return null
    return a * 60 + b
  }
  if (b >= 60 || c >= 60) return null
  return a * 3600 + b * 60 + c
}

/** Secondi per km -> "5:32". Con unita': "5:32 /km". */
export function fmtPace(secPerKm: number | undefined | null, withUnit = false): string {
  if (!secPerKm || !Number.isFinite(secPerKm)) return '–'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  const text = `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}`
  return withUnit ? `${text} /km` : text
}

/** Inserimento con la virgola ("72,4") -> numero. Vuoto -> undefined. */
export function parseNum(text: string): number | undefined {
  const t = text.trim().replace(',', '.')
  if (t === '') return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}
