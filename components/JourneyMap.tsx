'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Slotted } from '@/layouts/types'

/** One stop on the map: the item's slots plus its (already computed) detail link. Plain data only. */
export type Stop = Slotted & { detail: string | null }

/*
 * A stylised city map (no real geography): street grid with main roads, blocks with buildings / parks / a pond,
 * a river with bridges, street names and a compass. The route follows the streets with turns, the "you are here"
 * dot drives along it when you move to another stop, and the details card swaps on the right.
 * Everything is derived from integers, so server and browser always draw the same thing.
 */

const W = 720
const H = 440
const XS = [40, 120, 200, 280, 360, 440, 520, 600, 680] // vertical streets
const YS = [60, 140, 220, 300, 380] // horizontal streets
const ROWS = [2, 0, 3, 1, 2, 0, 3, 1] // row used by stop i; also differs across the wrap, so consecutive stops never coincide

const LAND = '#efebe0'
const BLOCK = '#e7e2d4'
const BUILDING = '#dcd6c4'
const ROAD = '#ffffff'
const ROAD_EDGE = '#d6d0bf'
const MAIN = '#fff4cf'
const MAIN_EDGE = '#e6c970'
const WATER = '#cfe0f5'
const TREE = '#9dccb7'

type Pt = { x: number; y: number }

const r1 = (n: number) => Math.round(n * 10) / 10
const pad = (n: number) => String(n).padStart(2, '0')
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)
const pathLen = (ps: Pt[]) => ps.slice(1).reduce((s, p, i) => s + dist(ps[i], p), 0)

/** Stops sit on street crossings, spread from left to right. */
function stopPoints(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const c = n === 1 ? 4 : 1 + Math.round((i * 6) / (n - 1))
    return { x: XS[c], y: YS[ROWS[i % ROWS.length]] }
  })
}

/** Remove repeated points and points in the middle of a straight run. */
function clean(ps: Pt[]): Pt[] {
  const out: Pt[] = []
  for (const p of ps) {
    const l = out[out.length - 1]
    if (!l || l.x !== p.x || l.y !== p.y) out.push(p)
  }
  return out.filter((p, i) => {
    if (i === 0 || i === out.length - 1) return true
    const a = out[i - 1]
    const b = out[i + 1]
    return !((a.x === p.x && p.x === b.x) || (a.y === p.y && p.y === b.y))
  })
}

/** Street-following route between two stops: out along a street, across on another one, then in. */
function legs(a: Pt, b: Pt, i: number): Pt[] {
  const ra = YS.indexOf(a.y)
  const rb = YS.indexOf(b.y)
  const ym = YS[(ra + rb + i + 1) % 4]
  return clean([a, { x: a.x, y: ym }, { x: b.x, y: ym }, b])
}

/** Polyline with rounded corners (like a navigation route). */
function rounded(ps: Pt[], r = 14): string {
  let d = `M${ps[0].x} ${ps[0].y}`
  for (let i = 1; i < ps.length - 1; i++) {
    const a = ps[i - 1]
    const p = ps[i]
    const b = ps[i + 1]
    const la = dist(a, p)
    const lb = dist(p, b)
    const k = Math.min(r, la / 2, lb / 2)
    const p1 = { x: p.x + ((a.x - p.x) / la) * k, y: p.y + ((a.y - p.y) / la) * k }
    const p2 = { x: p.x + ((b.x - p.x) / lb) * k, y: p.y + ((b.y - p.y) / lb) * k }
    d += ` L${r1(p1.x)} ${r1(p1.y)} Q${p.x} ${p.y} ${r1(p2.x)} ${r1(p2.y)}`
  }
  const last = ps[ps.length - 1]
  return d + ` L${last.x} ${last.y}`
}

/** All corner points travelled when going from stop `from` to stop `to`. */
function chain(wps: Pt[][], from: number, to: number): Pt[] {
  const out: Pt[] = []
  if (from < to) {
    for (let i = from; i < to; i++) out.push(...(out.length ? wps[i].slice(1) : wps[i]))
  } else if (from > to) {
    for (let i = from - 1; i >= to; i--) {
      const rev = [...wps[i]].reverse()
      out.push(...(out.length ? rev.slice(1) : rev))
    }
  }
  return out
}

// ---- Scenery (computed once; integers only) ----

type Block = { key: string; x: number; y: number; kind: 'park' | 'pond' | 'tower' | 'houses' }

const BLOCKS: Block[] = []
for (let c = 0; c < XS.length - 1; c++) {
  for (let r = 0; r < YS.length - 1; r++) {
    const h = (c * 73 + r * 151 + c * r * 37) % 11
    const kind: Block['kind'] = h < 2 ? 'park' : h === 2 ? 'pond' : h < 5 ? 'tower' : 'houses'
    BLOCKS.push({ key: `${c}-${r}`, x: XS[c] + 9, y: YS[r] + 9, kind })
  }
}

const STREET_NAMES = [
  { x: 150, y: YS[1], text: 'Library Lane' },
  { x: 560, y: YS[3], text: 'Seminar Street' },
  { x: 130, y: YS[2], text: 'University Blvd' },
  { x: 600, y: YS[0], text: 'Faculty Row' },
]
const VERTICAL_NAMES = [
  { x: XS[2], y: 300, text: 'Campus Road' },
  { x: XS[6], y: 160, text: 'Thesis Avenue' },
  { x: XS[4], y: 330, text: 'Main Street' },
]

function BlockArt({ b }: { b: Block }) {
  const { x, y, kind } = b
  const S = 62
  if (kind === 'park') {
    return (
      <g>
        <rect x={x} y={y} width={S} height={S} rx="10" fill="var(--teal)" opacity="0.85" />
        <circle cx={x + 16} cy={y + 18} r="6" fill={TREE} />
        <circle cx={x + 40} cy={y + 14} r="5" fill={TREE} />
        <circle cx={x + 30} cy={y + 40} r="7" fill={TREE} />
        <circle cx={x + 50} cy={y + 46} r="5" fill={TREE} />
      </g>
    )
  }
  if (kind === 'pond') {
    return (
      <g>
        <rect x={x} y={y} width={S} height={S} rx="10" fill="var(--teal)" opacity="0.7" />
        <ellipse cx={x + S / 2} cy={y + S / 2} rx="19" ry="14" fill={WATER} />
      </g>
    )
  }
  if (kind === 'tower') {
    return (
      <g>
        <rect x={x} y={y} width={S} height={S} rx="8" fill={BLOCK} />
        <rect x={x + 10} y={y + 10} width="42" height="42" rx="6" fill={BUILDING} />
        <rect x={x + 18} y={y + 18} width="26" height="26" rx="4" fill={BLOCK} />
      </g>
    )
  }
  return (
    <g>
      <rect x={x} y={y} width={S} height={S} rx="8" fill={BLOCK} />
      <rect x={x + 7} y={y + 7} width="22" height="20" rx="3" fill={BUILDING} />
      <rect x={x + 33} y={y + 7} width="22" height="20" rx="3" fill={BUILDING} />
      <rect x={x + 7} y={y + 33} width="22" height="22" rx="3" fill={BUILDING} />
      <rect x={x + 33} y={y + 33} width="22" height="22" rx="3" fill={BUILDING} />
    </g>
  )
}

const MAP_TEXT = { fontSize: 9, fill: '#948e79', fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: 0.6 } as const

const cardVariants = {
  enter: (d: number) => ({ opacity: 0, x: 20 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -20 * d }),
}

export default function JourneyMap({ stops }: { stops: Stop[] }) {
  const reduce = useReducedMotion()
  const [st, setSt] = useState({ cur: 0, prev: 0 })

  const n = stops.length
  const pts = useMemo(() => stopPoints(n), [n])
  const wps = useMemo(() => pts.slice(0, -1).map((a, i) => legs(a, pts[i + 1], i)), [pts])
  const lens = useMemo(() => wps.map(pathLen), [wps])
  const segs = useMemo(() => wps.map((w) => rounded(w)), [wps])

  if (n === 0) return null

  const cur = Math.min(st.cur, n - 1)
  const prev = Math.min(st.prev, n - 1)
  const dir = cur >= prev ? 1 : -1
  const s = stops[cur]

  function go(i: number) {
    setSt((old) => {
      const c = Math.min(old.cur, n - 1)
      const next = Math.max(0, Math.min(n - 1, i))
      return next === c ? old : { cur: next, prev: c }
    })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') go(cur + 1)
    else if (e.key === 'ArrowLeft') go(cur - 1)
  }

  // The "you are here" dot drives along the streets from the previous stop to the current one
  const lo = Math.min(prev, cur)
  const hi = Math.max(prev, cur)
  const travelLen = lens.slice(lo, hi).reduce((a, b) => a + b, 0)
  const drive = chain(wps, prev, cur)
  const duration = reduce ? 0 : Math.min(2, Math.max(0.7, travelLen / 300))
  let acc = 0
  const times = drive.map((p, i) => {
    if (i > 0) acc += dist(drive[i - 1], p)
    return travelLen > 0 ? acc / travelLen : 0
  })

  const order = pts.map((_, i) => i).sort((a, b) => (a === cur ? 1 : 0) - (b === cur ? 1 : 0))
  const here = pts[cur]
  const calloutText = (s.title || 'Stop').slice(0, 28)
  const calloutW = Math.max(64, calloutText.length * 6.6 + 22)
  const calloutLeft = here.x > W - 260

  return (
    <div
      className="pop-card overflow-hidden"
      role="group"
      aria-roledescription="carousel"
      aria-label="Journey map"
      onKeyDown={onKeyDown}
    >
      <div className="grid lg:grid-cols-[1.45fr_1fr]">
        {/* Map */}
        <div className="relative border-b border-[color:var(--line)] lg:border-b-0 lg:border-r" style={{ backgroundColor: LAND }}>
          {/* Search-bar style chip, like a maps app */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[75%] items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium shadow-[var(--shadow-sm)]">
            <MapPin className="h-4 w-4 shrink-0 text-[color:var(--accent)]" />
            <span className="truncate">{s.title || 'Stop'}</span>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
            <rect width={W} height={H} fill={LAND} />

            {/* River (roads cross it as bridges) */}
            <path d="M-20 412 C 120 382 230 442 370 416 S 600 386 750 420" fill="none" stroke={WATER} strokeWidth="40" />
            <path d="M-20 412 C 120 382 230 442 370 416 S 600 386 750 420" fill="none" stroke="#e3eefb" strokeWidth="6" strokeDasharray="14 22" strokeLinecap="round" />

            {/* Blocks */}
            {BLOCKS.map((b) => (
              <BlockArt key={b.key} b={b} />
            ))}

            {/* Streets: casing first, then the road surface, so crossings merge cleanly */}
            <g fill="none" strokeLinecap="butt">
              {XS.map((x, i) => i !== 4 && <path key={`vc${x}`} d={`M${x} -10 V${H + 10}`} stroke={ROAD_EDGE} strokeWidth="15" />)}
              {YS.map((y, i) => i !== 2 && <path key={`hc${y}`} d={`M-10 ${y} H${W + 10}`} stroke={ROAD_EDGE} strokeWidth="15" />)}
              {XS.map((x, i) => i !== 4 && <path key={`vr${x}`} d={`M${x} -10 V${H + 10}`} stroke={ROAD} strokeWidth="12" />)}
              {YS.map((y, i) => i !== 2 && <path key={`hr${y}`} d={`M-10 ${y} H${W + 10}`} stroke={ROAD} strokeWidth="12" />)}
              {/* Main roads */}
              <path d={`M${XS[4]} -10 V${H + 10}`} stroke={MAIN_EDGE} strokeWidth="25" />
              <path d={`M-10 ${YS[2]} H${W + 10}`} stroke={MAIN_EDGE} strokeWidth="25" />
              <path d={`M${XS[4]} -10 V${H + 10}`} stroke={MAIN} strokeWidth="21" />
              <path d={`M-10 ${YS[2]} H${W + 10}`} stroke={MAIN} strokeWidth="21" />
            </g>

            {/* Street names */}
            <g aria-hidden>
              {STREET_NAMES.map((t) => (
                <text key={t.text} x={t.x} y={t.y} dy="3" textAnchor="middle" style={MAP_TEXT}>
                  {t.text.toUpperCase()}
                </text>
              ))}
              {VERTICAL_NAMES.map((t) => (
                <text key={t.text} transform={`translate(${t.x} ${t.y}) rotate(-90)`} dy="3" textAnchor="middle" style={MAP_TEXT}>
                  {t.text.toUpperCase()}
                </text>
              ))}
            </g>

            {/* Route: dotted for what is ahead, solid blue with a white edge for what is travelled */}
            {segs.map((d, i) => (
              <path key={`ahead-${i}`} d={d} fill="none" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="4" strokeDasharray="0.1 9" strokeLinecap="round" />
            ))}
            {segs.map((d, i) => {
              if (i >= cur) return null
              const fresh = cur > prev && i >= prev
              const before = lens.slice(prev, i).reduce((a, b) => a + b, 0)
              return (
                <g key={`done-${i}`}>
                  <path d={d} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: fresh && !reduce ? 0 : 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: fresh && travelLen > 0 ? duration * (lens[i] / travelLen) : 0,
                      delay: fresh && travelLen > 0 ? duration * (before / travelLen) : 0,
                      ease: 'linear',
                    }}
                  />
                </g>
              )
            })}

            {/* "You are here" dot driving along the route */}
            {drive.length > 1 ? (
              <motion.circle
                key={`${prev}-${cur}`}
                r="7"
                fill="#fff"
                stroke="var(--accent)"
                strokeWidth="3.5"
                initial={{ cx: drive[0].x, cy: drive[0].y }}
                animate={{ cx: drive.map((p) => p.x), cy: drive.map((p) => p.y) }}
                transition={{ duration, times, ease: 'linear' }}
              />
            ) : (
              <circle cx={here.x} cy={here.y} r="7" fill="#fff" stroke="var(--accent)" strokeWidth="3.5" />
            )}

            {/* Pins */}
            {order.map((i) => {
              const p = pts[i]
              const on = i === cur
              const passed = i < cur
              return (
                <g
                  key={i}
                  transform={`translate(${p.x} ${p.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stops[i].title || 'Stop'}, ${i + 1} of ${n}`}
                  aria-pressed={on}
                  onClick={() => go(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      go(i)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx="0" cy="-22" r="30" fill="transparent" />
                  {on && !reduce && (
                    <g transform="scale(1 0.38)">
                      <motion.circle
                        cx="0"
                        cy="0"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        animate={{ r: [8, 30], opacity: [0.7, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      />
                    </g>
                  )}
                  <ellipse cx="0" cy="1" rx="7" ry="2.5" fill="rgba(15,27,51,0.22)" />
                  <motion.g animate={{ y: on ? -8 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                    <path
                      d="M0 0 C -10 -14 -14 -22 -14 -28 A 14 14 0 1 1 14 -28 C 14 -22 10 -14 0 0 Z"
                      style={{
                        fill: on ? 'var(--accent)' : passed ? 'var(--ink)' : '#fff',
                        stroke: 'var(--ink)',
                        strokeWidth: 1.5,
                        transition: 'fill 0.3s',
                      }}
                    />
                    <circle cx="0" cy="-28" r="5" style={{ fill: on ? 'var(--hi)' : passed ? '#fff' : 'var(--ink)', transition: 'fill 0.3s' }} />
                  </motion.g>
                  <text
                    y="21"
                    textAnchor="middle"
                    style={{
                      fontSize: 11,
                      fontWeight: on ? 700 : 500,
                      fontFamily: 'var(--font-geist-mono), monospace',
                      fill: 'var(--ink)',
                      paintOrder: 'stroke',
                      stroke: '#fff',
                      strokeWidth: 4,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {stops[i].meta || pad(i + 1)}
                  </text>
                  {on && (
                    <motion.g key={cur} initial={{ opacity: 0, x: calloutLeft ? 6 : -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.15 }}>
                      <rect
                        x={calloutLeft ? -26 - calloutW : 26}
                        y={-52}
                        width={calloutW}
                        height="26"
                        rx="13"
                        fill="#fff"
                        stroke="var(--line)"
                      />
                      <text
                        x={calloutLeft ? -26 - calloutW / 2 : 26 + calloutW / 2}
                        y={-39}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 11.5, fontWeight: 600, fill: 'var(--ink)' }}
                      >
                        {calloutText}
                      </text>
                    </motion.g>
                  )}
                </g>
              )
            })}

            {/* Compass */}
            <g transform="translate(676 34)" aria-hidden>
              <circle r="17" fill="#fff" stroke={ROAD_EDGE} />
              <path d="M0 -12 L5 5 L0 1.5 L-5 5 Z" fill="var(--ink)" />
              <text y="-22" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: 'var(--muted)' }}>N</text>
            </g>
          </svg>
        </div>

        {/* Details */}
        <div className="flex flex-col p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="pop-label">
              Stop {pad(cur + 1)} / {pad(n)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(cur - 1)}
                disabled={cur === 0}
                aria-label="Previous stop"
                className="pop-btn pop-btn-ghost !px-3 !py-2 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(cur + 1)}
                disabled={cur === n - 1}
                aria-label="Next stop"
                className="pop-btn pop-btn-ink !px-3 !py-2 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-[13rem] flex-1" aria-live="polite">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={cur}
                custom={dir}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0 : 0.28, ease: 'easeOut' }}
              >
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" className="mb-4 aspect-[16/9] w-full rounded-xl border border-[color:var(--line)] object-cover" />
                )}
                {s.meta && (
                  <div className="mb-3">
                    <span className="pop-pill pop-yellow">{s.meta}</span>
                  </div>
                )}
                <h3 className="pop-display text-2xl leading-tight md:text-3xl">{s.title}</h3>
                {s.subtitle && <p className="mt-1 font-medium text-[color:var(--muted)]">{s.subtitle}</p>}
                {s.body && <p className="mt-4 whitespace-pre-line leading-relaxed">{s.body}</p>}
                {s.list.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {s.list.map((pt, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                {s.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="pop-pill">{t}</span>
                    ))}
                  </div>
                )}
                {(s.detail || s.link) && (
                  <div className="mt-5 flex flex-wrap gap-4">
                    {s.detail && <Link href={s.detail} className="pop-link text-sm">View details →</Link>}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="pop-link text-sm">
                        Open link <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-2" role="group" aria-label="Stops">
            {pts.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to stop ${i + 1}`}
                aria-current={i === cur}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === cur ? 'w-7 bg-[color:var(--accent)]' : 'w-2 bg-[color:var(--line)] hover:bg-[color:var(--muted)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
