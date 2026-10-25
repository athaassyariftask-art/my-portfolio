'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react'
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
  image: string // school logo
  detail: string | null
}

const CARD_H = 212 // px; width follows the container (max 360)
const PEEK = 30 // how much of each card behind the front one shows
const FAN = 58 // the same, while the stack is hovered or focused
const SWIPE = 70 // px of horizontal drag that counts as "next/previous"

// Soft tint behind each card; cycles so neighbours in the stack look different
const TINTS = ['var(--blue)', 'var(--pink)', 'var(--teal)', 'var(--yellow)', 'var(--orange)']
// Fine concentric lines, like the guilloche on banknotes and ID cards. Purely decorative.
const GUILLOCHE = 'repeating-radial-gradient(circle at 105% 115%, rgba(15,27,51,0.07) 0 1px, transparent 1px 7px)'
// Pastel "hologram" ribbon along the card edge
const HOLO = 'linear-gradient(180deg, #f6c650, #f4a0b8, #9ec5f0, #8fd6b8, #f6c650)'

function initials(name: string): string {
  const caps = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('')
  return (caps || name.slice(0, 2)).slice(0, 3).toUpperCase()
}

/** Deterministic pseudo-random bytes from a string: the same entry always draws the same pattern. */
function hashBytes(seed: string, count: number): number[] {
  let h = 2166136261
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i % seed.length), 16777619) >>> 0
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    out.push(h)
  }
  return out
}

/** Stable pseudo-barcode: the same school always gets the same bars. */
export function bars(seed: string, count = 34): number[] {
  return hashBytes(seed, count).map((h) => 1 + (h % 3)) // widths 1..3
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

/** Decorative (non-scannable) dot-matrix stamp for the back of a card, seeded off the entry. */
function DotMatrix({ seed, size = 9 }: { seed: string; size?: number }) {
  const bits = useMemo(() => hashBytes(seed, size * size).map((h) => h % 5 === 0), [seed, size])
  return (
    <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className="h-10 w-10 text-[color:var(--paper)]">
      {bits.map((on, i) =>
        on ? <rect key={i} x={i % size} y={Math.floor(i / size)} width={1} height={1} fill="currentColor" /> : null,
      )}
    </svg>
  )
}

/** A loose, hand-drawn "signature" squiggle, purely decorative. */
function Signature() {
  return (
    <svg aria-hidden viewBox="0 0 80 20" className="h-5 w-20 text-[color:var(--paper)] opacity-80">
      <path
        d="M2 15 C 10 2, 16 2, 20 12 S 30 20, 34 10 S 42 2, 46 11 S 56 18, 60 9 S 70 4, 78 10"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** School logo on a white tile (never cropped). Falls back to the school's initials. */
function LogoBox({ src, name, size = 84, border }: { src: string; name: string; size?: number; border: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white font-bold text-[color:var(--ink)] shadow-sm"
      style={{ width: size, height: size, borderColor: border, fontSize: size * 0.28 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain p-1.5" />
      ) : (
        initials(name)
      )}
    </span>
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
 * Level progress: one segment per education level, oldest first. Cleared levels are full, the level in
 * progress fills by how far through its dates we are (or pulses when its end date is unknown).
 */
function LevelBar({ segs }: { segs: { title: string; status: Status }[] }) {
  const reduce = useReducedMotion()
  const cleared = segs.filter((x) => x.status?.kind === 'done').length
  const running = segs.find((x) => x.status?.kind === 'progress')?.status
  const hasLive = segs.some((x) => x.status?.kind === 'live')
  const frac = segs.map((x) => (x.status?.kind === 'done' ? 1 : x.status?.kind === 'progress' ? x.status.value : 0))
  const pct = Math.round((frac.reduce((a, b) => a + b, 0) / segs.length) * 100)
  return (
    <div className="mb-5">
      <p className="pop-label mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-[color:var(--accent)]" aria-hidden />
          Level progress
        </span>
        <span>
          {cleared} of {segs.length} cleared
          {running?.kind === 'progress' ? ` · ${running.line}` : ''}
          {!hasLive && cleared + (running ? 1 : 0) > 0 ? ` · ${pct}%` : ''}
        </span>
      </p>
      <div className="flex gap-1.5" role="img" aria-label={`${cleared} of ${segs.length} education levels cleared`}>
        {segs.map((x, i) => (
          <span key={i} title={x.title} className="relative h-3 flex-1 overflow-hidden rounded-full border border-[color:var(--line)] bg-white">
            {x.status?.kind === 'live' ? (
              <motion.span
                className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[color:var(--hi)]"
                animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            ) : (
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: x.status?.kind === 'done' ? 'var(--accent)' : 'var(--hi)' }}
                initial={{ width: reduce ? `${frac[i] * 100}%` : '0%' }}
                animate={{ width: `${frac[i] * 100}%` }}
                transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.1 + i * 0.12, ease: 'easeOut' }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Small corner stamp: a trophy for a level already cleared, a flame for one in progress. */
function StatusStamp({ status }: { status: Status }) {
  if (status?.kind === 'done') {
    return (
      <span
        aria-hidden
        className="absolute right-2 top-2 z-10 flex h-7 w-7 rotate-[8deg] items-center justify-center rounded-full border-2 border-dashed border-[color:var(--accent)] bg-[color:var(--cream)] text-[color:var(--accent)]"
      >
        <Trophy className="h-3.5 w-3.5" />
      </span>
    )
  }
  if (status?.kind === 'live' || status?.kind === 'progress') {
    return (
      <span aria-hidden className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--hi)] text-[color:var(--ink)]">
        <Flame className="h-3.5 w-3.5" />
      </span>
    )
  }
  return null
}

/**
 * Education as a stack of student-ID cards, styled a little like game-save slots: finished levels carry
 * a trophy stamp, the level in progress carries a flame and a progress ring, and a level bar on top shows
 * the whole path. Cards use the school logo you upload. The front card is the one being read; the others
 * peek out behind it and fan out on hover. Bring a card forward by clicking it, dragging the front card
 * left/right, using the arrows, or the arrow keys. Click (or Enter/Space) the front card again to flip it.
 */
export default function IdCardStack({ entries }: { entries: IdEntry[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [fan, setFan] = useState(false)
  const [flipped, setFlipped] = useState(false)
  // Progress depends on today's date: filled in after mount so server and browser HTML stay identical
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])
  const stackRef = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)

  const n = entries.length
  if (n === 0) return null
  const cur = entries[Math.min(active, n - 1)]
  const curStatus = statusOf(cur.meta, now)
  const peek = fan ? FAN : PEEK
  const visible = Math.min(n - 1, 4)

  // Level = position in time (oldest first), whatever order the entries are listed in
  const order = entries
    .map((e, i) => ({ i, t: periodRange(e.meta)?.start.getTime() ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
  const levelOf: number[] = []
  order.forEach((o, k) => {
    levelOf[o.i] = k + 1
  })
  const segs = order.map((o) => ({ title: entries[o.i].title, status: statusOf(entries[o.i].meta, now) }))

  function go(d: number) {
    setActive((a) => (a + d + n) % n)
    setFlipped(false)
  }

  function onCardTap(i: number, isFront: boolean) {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if (isFront) setFlipped((f) => !f)
    else {
      setActive(i)
      setFlipped(false)
    }
  }

  function onDragEnd(info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE || Math.abs(info.velocity.x) > 500) {
      go(info.offset.x < 0 ? 1 : -1)
    }
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      {/* The stack */}
      <div className="mx-auto w-full max-w-[360px] lg:mx-0">
        <LevelBar segs={segs} />

        <div
          ref={stackRef}
          tabIndex={0}
          role="group"
          aria-label="Education cards. Drag or use the left and right arrow keys to switch card."
          onMouseEnter={() => setFan(true)}
          onMouseLeave={() => setFan(false)}
          onFocus={() => setFan(true)}
          onBlur={() => setFan(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1) }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) }
          }}
          className="relative w-full rounded-2xl outline-offset-8"
          style={{ height: CARD_H + FAN * visible, perspective: 1400 }}
        >
          {entries.map((e, i) => {
            const rank = (i - active + n) % n // 0 = front
            const shown = Math.min(rank, 4)
            const st = statusOf(e.meta, now)
            const isFront = rank === 0
            const isFlipped = isFront && flipped
            const edge = st?.kind === 'done' ? 'var(--accent)' : st ? 'var(--hi)' : 'var(--line)'
            return (
              <motion.button
                key={e.id}
                type="button"
                onClick={() => onCardTap(i, isFront)}
                aria-label={`${e.title}${e.meta ? `, ${e.meta}` : ''}${isFront ? (flipped ? ' (selected, showing back)' : ' (selected)') : ''}`}
                aria-current={isFront}
                tabIndex={-1}
                drag={isFront && !reduce ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                dragSnapToOrigin
                onDragStart={() => { dragged.current = false }}
                onDrag={(_, info) => { if (Math.abs(info.offset.x) > 8) dragged.current = true }}
                onDragEnd={(_, info) => onDragEnd(info)}
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
                  backgroundImage: `${GUILLOCHE}, linear-gradient(135deg, ${TINTS[i % TINTS.length]} 0%, var(--paper) 68%)`,
                  zIndex: n - rank,
                  borderColor: isFront ? 'var(--ink)' : undefined,
                  boxShadow: isFront ? 'var(--shadow-md)' : undefined,
                  pointerEvents: rank > 4 ? 'none' : 'auto',
                }}
              >
                {/* Top edge accent: shows this card's status at a glance even while stacked */}
                <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ background: edge }} />
                <StatusStamp status={st} />

                <motion.div
                  className="relative h-full w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 24 }}
                >
                  {/* Front face */}
                  <div className="absolute inset-0 flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                    {isFront && !reduce && (
                      <motion.span
                        key={`sheen-${active}`}
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-10 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
                        initial={{ left: '-45%' }}
                        animate={{ left: '120%' }}
                        transition={{ duration: 0.85, ease: 'easeOut' }}
                      />
                    )}

                    {/* Hologram ribbon and a faded logo watermark */}
                    <span aria-hidden className="absolute bottom-0 right-0 top-[38px] z-[1] w-1.5 opacity-70" style={{ background: HOLO }} />
                    {e.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt="" aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 h-44 w-44 object-contain opacity-[0.09] grayscale" />
                    )}

                    <span className="relative flex items-center justify-between gap-3 bg-[color:var(--ink)] py-2.5 pl-4 pr-12 text-white">
                      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]">Student ID</span>
                      <span className="text-[11px] tabular-nums opacity-80">Lvl {String(levelOf[i]).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
                    </span>

                    <span className="relative flex gap-4 p-4">
                      <LogoBox src={e.image} name={e.title} border={edge} />

                      <span className="min-w-0 flex-1">
                        <span className="pop-display block text-lg leading-tight">{e.title}</span>
                        {e.subtitle && <span className="mt-1 block text-sm leading-snug text-[color:var(--muted)]">{e.subtitle}</span>}
                        {e.meta && <span className="pop-label mt-2 block">{e.meta}</span>}
                      </span>

                      {st?.kind === 'progress' && <Ring value={st.value} />}
                    </span>

                    {/* Footer: barcode + status */}
                    <span className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 pr-2">
                      <Barcode seed={e.title + e.meta} />
                      {st?.kind === 'live' && <span className="pop-pill pop-yellow !text-[10px]">In progress</span>}
                      {st?.kind === 'done' && <span className="pop-label">Cleared</span>}
                      {st?.kind === 'progress' && <span className="pop-label">{st.line}</span>}
                    </span>
                  </div>

                  {/* Back face: only meaningful on the front card, but harmless (hidden) on the others */}
                  <div
                    className="absolute inset-0 flex flex-col justify-between bg-[color:var(--ink)] p-4 text-white"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <span className="flex items-start justify-between">
                      <span className="flex items-center gap-2">
                        {e.image && <LogoBox src={e.image} name={e.title} size={34} border="rgba(255,255,255,0.4)" />}
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">Verified</span>
                      </span>
                      <DotMatrix seed={e.id} />
                    </span>
                    <span>
                      <span className="pop-display block text-base leading-snug">{e.title}</span>
                      {e.tags.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {e.tags.slice(0, 4).map((t) => (
                            <span key={t} className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] tracking-wide opacity-90">
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="flex items-end justify-between">
                      <Signature />
                      <span className="text-[10px] uppercase tracking-[0.14em] opacity-60">Tap to flip back</span>
                    </span>
                  </div>
                </motion.div>
              </motion.button>
            )
          })}
        </div>

        <p className="pop-label mt-4 text-center opacity-70">Drag, use the arrows, or flip the front card</p>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-between gap-4">
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
                onClick={() => { setActive(i); setFlipped(false) }}
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
              <span className="pop-pill pop-yellow">Level {levelOf[Math.min(active, n - 1)]} of {n}</span>
              {cur.meta && <span className="pop-pill">{cur.meta}</span>}
              {curStatus?.kind === 'live' && (
                <span className="pop-label flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-[color:var(--hi)]" aria-hidden /> Currently active
                </span>
              )}
              {curStatus?.kind === 'done' && (
                <span className="pop-label flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-[color:var(--accent)]" aria-hidden /> Level cleared
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4">
              {cur.image && <LogoBox src={cur.image} name={cur.title} size={64} border="var(--line)" />}
              <h3 className="pop-display text-3xl leading-tight md:text-5xl">{cur.title}</h3>
            </div>
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
