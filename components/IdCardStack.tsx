'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { isLive, periodRange, progress } from '@/lib/period'

/** Plain data only: this is a client component, so nothing here can be a function. */
export type IdEntry = {
  id: string
  meta: string
  title: string // school / institution
  subtitle: string // program / major
  body: string
  list: string[]
  tags: string[]
  link: string
  image: string
  detail: string | null
}

const CARD_H = 212 // px; width follows the container (max 360)
const PEEK = 30 // how much of each card behind the front one shows
const FAN = 58 // the same, while the stack is hovered or focused

function initials(name: string): string {
  const caps = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('')
  return (caps || name.slice(0, 2)).slice(0, 3).toUpperCase()
}

/** Stable pseudo-barcode: the same school always gets the same bars. */
export function bars(seed: string, count = 34): number[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    out.push(1 + (h % 3)) // widths 1..3
  }
  return out
}

function Barcode({ seed }: { seed: string }) {
  const widths = useMemo(() => bars(seed), [seed])
  let x = 0
  const rects = widths.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={22} fill="currentColor" /> : null
    x += w + 1
    return r
  })
  return (
    <svg aria-hidden viewBox={`0 0 ${x} 22`} preserveAspectRatio="none" className="h-5 w-24 text-[color:var(--ink)] opacity-80">
      {rects}
    </svg>
  )
}

function Ring({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const reduce = useReducedMotion()
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - value) : c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: reduce ? 0 : 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-[color:var(--ink)]">
        {label ?? `${Math.round(value * 100)}%`}
      </span>
    </span>
  )
}

type Status = { kind: 'progress'; value: number; line: string } | { kind: 'live' } | { kind: 'done' } | null

function statusOf(meta: string, now: Date | null): Status {
  if (!meta) return null
  const r = periodRange(meta)
  if (r && r.end === null) return { kind: 'live' }
  if (r && r.end) {
    if (!now) return null
    if (r.end.getTime() <= now.getTime()) return { kind: 'done' }
    const value = progress(r as typeof r & { end: Date }, now)
    const months = (r.end.getFullYear() - r.start.getFullYear()) * 12 + r.end.getMonth() - r.start.getMonth() + 1
    const total = Math.max(1, Math.round(months / 6))
    const cur = Math.min(total, Math.max(1, Math.ceil(value * total)))
    return { kind: 'progress', value, line: months >= 12 ? `Semester ${cur} of ${total}` : `${Math.round(value * 100)}% complete` }
  }
  return isLive(meta) ? { kind: 'live' } : null
}

/**
 * Education as a stack of student-ID cards. The front card is the one being read; the others peek out behind it
 * and fan out while the stack is hovered. Click a card (or use the arrows / arrow keys) to bring it forward and
 * read its details on the right. A study that is still running shows a progress ring computed from its dates.
 */
export default function IdCardStack({ entries }: { entries: IdEntry[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [fan, setFan] = useState(false)
  // Progress depends on today's date: filled in after mount so server and browser HTML stay identical
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])
  const stackRef = useRef<HTMLDivElement>(null)

  const n = entries.length
  if (n === 0) return null
  const cur = entries[Math.min(active, n - 1)]
  const curStatus = statusOf(cur.meta, now)
  const peek = fan ? FAN : PEEK
  const visible = Math.min(n - 1, 4)
  const go = (d: number) => setActive((a) => (a + d + n) % n)

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      {/* The stack */}
      <div>
        <div
          ref={stackRef}
          tabIndex={0}
          role="group"
          aria-label="Education cards. Use the left and right arrow keys to switch card."
          onMouseEnter={() => setFan(true)}
          onMouseLeave={() => setFan(false)}
          onFocus={() => setFan(true)}
          onBlur={() => setFan(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1) }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
          }}
          className="relative mx-auto w-full max-w-[360px] rounded-2xl outline-offset-8"
          style={{ height: CARD_H + FAN * visible }}
        >
          {entries.map((e, i) => {
            const rank = (i - active + n) % n // 0 = front
            const shown = Math.min(rank, 4)
            const st = statusOf(e.meta, now)
            const isFront = rank === 0
            return (
              <motion.button
                key={e.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${e.title}${e.meta ? `, ${e.meta}` : ''}${isFront ? ' (selected)' : ''}`}
                aria-current={isFront}
                tabIndex={-1}
                initial={false}
                animate={{
                  y: FAN * visible - shown * peek, // front card rests at the bottom; the others peek out above it
                  scale: 1 - shown * 0.045,
                  rotate: isFront ? 0 : (i % 2 === 0 ? -1 : 1) * Math.min(shown, 3) * 1.1,
                  opacity: rank > 4 ? 0 : 1,
                }}
                whileHover={isFront || reduce ? undefined : { x: 6 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26 }}
                className="pop-card absolute left-0 top-0 block w-full cursor-pointer overflow-hidden text-left"
                style={{
                  height: CARD_H,
                  zIndex: n - rank,
                  borderColor: isFront ? 'var(--ink)' : undefined,
                  boxShadow: isFront ? 'var(--shadow-md)' : undefined,
                  pointerEvents: rank > 4 ? 'none' : 'auto',
                }}
              >
                {/* Card header */}
                <span className="flex items-center justify-between gap-3 bg-[color:var(--ink)] px-4 py-2.5 text-white">
                  <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]">Student ID</span>
                  <span className="text-[11px] tabular-nums opacity-80">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
                </span>

                <span className="flex gap-4 p-4">
                  {/* Photo */}
                  <span className="pop-yellow flex h-[84px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[color:var(--line)] text-lg font-bold text-[color:var(--ink)]">
                    {e.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(e.title)
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="pop-display block text-lg leading-tight">{e.title}</span>
                    {e.subtitle && <span className="mt-1 block text-sm leading-snug text-[color:var(--muted)]">{e.subtitle}</span>}
                    {e.meta && <span className="pop-label mt-2 block">{e.meta}</span>}
                  </span>

                  {st?.kind === 'progress' && <Ring value={st.value} />}
                </span>

                {/* Footer: barcode + status */}
                <span className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
                  <Barcode seed={e.title + e.meta} />
                  {st?.kind === 'live' && <span className="pop-pill pop-yellow !text-[10px]">In progress</span>}
                  {st?.kind === 'done' && <span className="pop-label">Completed</span>}
                  {st?.kind === 'progress' && <span className="pop-label">{st.line}</span>}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="mx-auto mt-6 flex max-w-[360px] items-center justify-between gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous card" className="pop-btn pop-btn-ghost !px-3 !py-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose a card">
            {entries.map((e, i) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={e.title}
                onClick={() => setActive(i)}
                className="h-2.5 rounded-full transition-all duration-300"
                style={{ width: i === active ? 28 : 10, background: i === active ? 'var(--accent)' : 'var(--line)' }}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label="Next card" className="pop-btn pop-btn-ghost !px-3 !py-2">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details of the front card */}
      <div className="min-w-0" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cur.id}
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -10 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
          >
            <div className="flex flex-wrap items-center gap-3">
              {cur.meta && <span className="pop-pill pop-yellow">{cur.meta}</span>}
              {curStatus?.kind === 'live' && <span className="pop-label">In progress</span>}
              {curStatus?.kind === 'done' && <span className="pop-label">Completed</span>}
            </div>

            <h3 className="pop-display mt-4 text-3xl leading-tight md:text-5xl">{cur.title}</h3>
            {cur.subtitle && <p className="mt-2 text-lg text-[color:var(--muted)] md:text-xl">{cur.subtitle}</p>}

            {curStatus?.kind === 'progress' && (
              <div className="pop-card mt-6 flex max-w-md items-center gap-4 p-4">
                <Ring value={curStatus.value} size={64} />
                <div>
                  <p className="pop-display text-xl leading-tight">{curStatus.line}</p>
                  <p className="pop-label mt-1">Expected to finish {cur.meta.split(/\s*[-–—]\s*|\s+to\s+/i).pop()}</p>
                </div>
              </div>
            )}

            {cur.body && <p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed">{cur.body}</p>}

            {cur.list.length > 0 && (
              <ul className="mt-5 max-w-3xl space-y-3">
                {cur.list.map((pt, j) => (
                  <motion.li
                    key={j}
                    initial={{ opacity: 0, x: reduce ? 0 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.12 + j * 0.07 }}
                    className="flex gap-3 leading-relaxed"
                  >
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                    {pt}
                  </motion.li>
                ))}
              </ul>
            )}

            {cur.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {cur.tags.map((t) => (
                  <span key={t} className="pop-pill">{t}</span>
                ))}
              </div>
            )}

            {(cur.detail || cur.link) && (
              <div className="mt-6 flex flex-wrap gap-4">
                {cur.detail && <Link href={cur.detail} className="pop-link text-sm">View details →</Link>}
                {cur.link && (
                  <a href={cur.link} target="_blank" rel="noreferrer" className="pop-link text-sm">
                    Open link <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
