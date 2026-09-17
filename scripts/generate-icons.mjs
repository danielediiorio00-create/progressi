/**
 * Genera le icone PNG della PWA (schermata Home di iPhone, manifest) senza
 * dipendenze esterne: disegna pixel per pixel un "sole" arancione su sfondo
 * sabbia e codifica il PNG con zlib di Node.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ---- Codifica PNG minimale (RGBA 8 bit, nessun filtro) -------------------

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(size, pixelAt) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // tipo di filtro: nessuno
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelAt(x, y)
      const o = y * stride + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit per canale
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- Disegno ----------------------------------------------------------------

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (c1, c2, t) => c1.map((v, i) => Math.round(v + (c2[i] - v) * t))
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (t) => {
  t = clamp01(t)
  return t * t * (3 - 2 * t)
}

const SAND_TOP = hex('#EFE7DF')
const SAND_BOTTOM = hex('#E2D6C7')
const ORANGE = hex('#FF8A00')
const ORANGE_SOFT = hex('#FFC27A')
const SHADOW = hex('#B99E82')

function drawIcon(size, sunRadius) {
  const cx = size * 0.5
  const cy = size * 0.5
  const r = size * sunRadius
  const hx = size * 0.4 // punto luce del gradiente radiale
  const hy = size * 0.4
  return encodePng(size, (x, y) => {
    const px = x + 0.5
    const py = y + 0.5
    // sfondo sabbia con gradiente verticale
    let bg = mix(SAND_TOP, SAND_BOTTOM, py / size)
    // ombra morbida e diffusa sotto il sole
    const sd = Math.hypot(px - cx, py - (cy + r * 0.35))
    const shadow = 0.3 * (1 - smooth((sd - r * 0.75) / (r * 0.9)))
    bg = mix(bg, SHADOW, shadow)
    // disco con gradiente radiale e bordo anti-aliasing (1 px)
    const d = Math.hypot(px - cx, py - cy)
    const cover = clamp01(r - d + 0.5)
    const t = clamp01(Math.hypot(px - hx, py - hy) / (r * 1.6))
    const sun = mix(ORANGE_SOFT, ORANGE, smooth(t))
    return mix(bg, sun, cover)
  })
}

const files = [
  ['icon-192.png', 192, 0.3],
  ['icon-512.png', 512, 0.3],
  ['icon-512-maskable.png', 512, 0.24], // zona sicura piu' stretta per le icone "maskable"
  ['apple-touch-icon.png', 180, 0.3],
]

for (const [name, size, radius] of files) {
  writeFileSync(join(outDir, name), drawIcon(size, radius))
  console.log(`✓ ${name}`)
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EFE7DF"/><stop offset="1" stop-color="#E2D6C7"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.38" cy="0.38" r="0.75">
      <stop offset="0" stop-color="#FFC27A"/><stop offset="1" stop-color="#FF8A00"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <circle cx="32" cy="32" r="19" fill="url(#sun)"/>
</svg>
`
writeFileSync(join(outDir, 'favicon.svg'), favicon)
console.log('✓ favicon.svg')
