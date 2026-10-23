'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

// A stylised map (no real geography): dotted paper, a few "parks" and "water", a dashed route with a pin per item.
// Picking a stop (pin, dots, or the arrow buttons) draws the route up to it and swaps the details card.

const W = 600
const H = 360
// Teardrop pin with its tip at (0, 0); the round head is centred on (0, -28)
const PIN = 'M0 0 C -10 -14 -14 -22 -14 -28 A 14 14 0 1 1 14 -28 C 14 -22 10 -14 0 0 Z'

type Pt = { x: number; y: number }

const r1 = (n: number) => Math.round(n * 10) / 10
const pad = (n: number) => String(n).padStart(2, '0')

/** Stops spread left to right along a gentle wave. */
function stops(n: number): Pt[] {
  if (n === 1) return [{ x: W / 2, y: H / 2 + 20 }]
  const left = 80
  const right = W - 80
  return Array.from({ length: n }, (_, i) => ({
    x: r1(left + ((right - left) * i) / (n - 1)),
    y: r1(H / 2 + 10 + Math.sin(i * 1.35 + 0.6) * 85),
  }))
}

/** Smooth curve from stop i to stop i + 1 (Catmull-Rom converted to a cubic Bézier). */
function segment(p: Pt[], i: number): string {
  const p0 = p[i - 1] ?? p[i]
  const p1 = p[i]
  const p2 = p[i + 1]
  const p3 = p[i + 2] ?? p2
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
  return `M${p1.x} ${p1.y} C${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${p2.x} ${p2.y}`
}

const card = {
  enter: (d: number) => ({ opacity: 0, x: 20 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -20 * d }),
}

/**
 * Animated "journey map": one pin per item, a route that draws itself as you move on, and a details card
 * with previous / next buttons. Good for education or any ordered path. Arrow keys work while focus is inside.
 */
export default function Journey({ items, fields, detailHref }: LayoutProps) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState(1)

  const n = items.length
  const slots = useMemo(() => items.map((it) => readSlots(it, fields)), [items, fields])
  const pts = useMemo(() => stops(n), [n])
  const segs = useMemo(() => pts.slice(0, -1).map((_, i) => segment(pts, i)), [pts])

  if (n === 0) return null

  const cur = Math.min(active, n - 1)
  const s = slots[cur]
  const detail = detailHref(items[cur])

  function go(i: number) {
    const next = Math.max(0, Math.min(n - 1, i))
    if (next === cur) return
    setDir(next > cur ? 1 : -1)
    setActive(next)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') go(cur + 1)
    else if (e.key === 'ArrowLeft') go(cur - 1)
  }

  // Draw the active pin last so it sits on top of its neighbours
  const order = pts.map((_, i) => i).sort((a, b) => (a === cur ? 1 : 0) - (b === cur ? 1 : 0))

  return (
    <div
      className="pop-card overflow-hidden"
      role="group"
      aria-roledescription="carousel"
      aria-label="Journey map"
      onKeyDown={onKeyDown}
    >
      <div className="grid lg:grid-cols-[1.3fr_1fr]">
        {/* Map */}
        <div className="relative border-b border-[color:var(--line)] bg-[color:var(--cream)] lg:border-b-0 lg:border-r">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
            <defs>
              <pattern id={`${uid}-dots`} width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(15,27,51,0.14)" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill={`url(#${uid}-dots)`} />

            {/* Scenery */}
            <path d="M-10 305 C 90 255 170 335 270 305 S 440 335 610 285 L610 370 L-10 370 Z" fill="var(--blue)" opacity="0.6" />
            <rect x="40" y="44" width="92" height="58" rx="18" fill="var(--teal)" opacity="0.6" />
            <rect x="408" y="38" width="124" height="70" rx="20" fill="var(--teal)" opacity="0.7" />
            <path d="M-10 128 C 150 168 300 66 610 136" fill="none" stroke="var(--paper)" strokeWidth="14" strokeLinecap="round" />
            <path d="M246 -10 C 276 104 222 224 292 370" fill="none" stroke="var(--paper)" strokeWidth="10" strokeLinecap="round" />
            <g transform="translate(560 52)">
              <circle r="18" fill="var(--paper)" stroke="var(--line)" />
              <path d="M0 -12 L5 5 L0 1.5 L-5 5 Z" fill="var(--ink)" />
              <text y="-24" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                N
              </text>
            </g>

            {/* Route: dashed for the whole way, solid accent for the part already travelled */}
            {segs.map((d, i) => (
              <path key={`base-${i}`} d={d} fill="none" stroke="var(--ink)" strokeOpacity="0.3" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
            ))}
            {segs.map(
              (d, i) =>
                i < cur && (
                  <motion.path
                    key={`done-${i}`}
                    d={d}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={{ pathLength: reduce ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }}
                  />
                ),
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
                  aria-label={`${slots[i].title || 'Stop'}, ${i + 1} of ${n}`}
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
                        animate={{ r: [8, 28], opacity: [0.7, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      />
                    </g>
                  )}
                  <ellipse cx="0" cy="1" rx="7" ry="2.5" fill="rgba(15,27,51,0.2)" />
                  <motion.g animate={{ y: on ? -8 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                    <path
                      d={PIN}
                      style={{
                        fill: on ? 'var(--accent)' : passed ? 'var(--ink)' : 'var(--paper)',
                        stroke: 'var(--ink)',
                        strokeWidth: 1.5,
                        transition: 'fill 0.3s',
                      }}
                    />
                    <circle cx="0" cy="-28" r="5" style={{ fill: on ? 'var(--hi)' : passed ? 'var(--paper)' : 'var(--ink)', transition: 'fill 0.3s' }} />
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
                      stroke: 'var(--cream)',
                      strokeWidth: 4,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {slots[i].meta || pad(i + 1)}
                  </text>
                </g>
              )
            })}
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
                variants={card}
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
                {(detail || s.link) && (
                  <div className="mt-5 flex flex-wrap gap-4">
                    {detail && <Link href={detail} className="pop-link text-sm">View details →</Link>}
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
