'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Briefcase, Crown, GraduationCap } from 'lucide-react'
import { duration, isLive } from '@/lib/period'
import TechIcon from '@/components/TechIcon'

/** Plain data only: this is a client component, so nothing here can be a function. */
export type TrackRole = {
  id: string
  meta: string
  title: string
  body: string
  list: string[]
  tags: string[]
  link: string
  detail: string | null
}
export type TrackGroup = { org: string; logo: string; roles: TrackRole[] }

/** Short git-style id (7 hex characters) derived from the role, purely decorative: every role is a "commit". */
function shortHash(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h.toString(16).padStart(8, '0').slice(0, 7)
}

/** Up to three capital letters of the organisation name, for the round badge. */
function initials(name: string): string {
  const caps = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('')
  return (caps || name.slice(0, 2)).slice(0, 3).toUpperCase()
}

/**
 * Best-effort "kind" of role guessed from its title, purely cosmetic: a small coloured icon so the list
 * reads as a mix of leadership/teaching/internship instead of one repeated shape. A title that matches
 * nothing gets no icon, so this never says something false. Colours hold up on both light and dark.
 */
function roleKind(title: string): { label: string; color: string; icon: typeof Crown } | null {
  if (/\b(head|lead|koordinator|coordinator|ketua)\b/i.test(title)) return { label: 'Leadership', color: 'var(--accent)', icon: Crown }
  if (/\b(trainer|mentor|pelatih)\b/i.test(title)) return { label: 'Teaching', color: 'var(--hi)', icon: GraduationCap }
  if (/\bintern(ship)?\b/i.test(title)) return { label: 'Internship', color: '#d6587a', icon: Briefcase }
  return null
}

type Flat = TrackRole & { org: string; logo: string }

/**
 * Career track as a split view: every role listed compactly on the left (grouped by organisation),
 * full detail for the selected one on the right. Good when experience is "deep" rather than "wide" —
 * several roles stacked inside one organisation read as a clear list instead of a long CV of cards.
 */
export default function CareerTrack({ groups }: { groups: TrackGroup[] }) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const listRef = useRef<HTMLDivElement>(null)

  const flat: Flat[] = useMemo(
    () => groups.flatMap((g) => g.roles.map((r) => ({ ...r, org: g.org, logo: g.logo }))),
    [groups],
  )
  const [selected, setSelected] = useState(() => flat.find((r) => isLive(r.meta))?.id ?? flat[0]?.id ?? '')
  // Duration depends on today's date, so it's filled in after mount (keeps server and browser HTML identical)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])

  if (flat.length === 0) return null
  const cur = flat.find((r) => r.id === selected) ?? flat[0]
  const curKind = roleKind(cur.title)
  const curLive = isLive(cur.meta)
  const orgCount = groups.filter((g) => g.org).length || groups.length

  function move(d: number) {
    const i = flat.findIndex((r) => r.id === selected)
    const next = flat[(i + d + flat.length) % flat.length]
    if (next) setSelected(next.id)
  }

  return (
    <div>
      <p className="pop-label mb-4">
        {flat.length} role{flat.length > 1 ? 's' : ''} · {orgCount} organization{orgCount > 1 ? 's' : ''}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-10">
        {/* Left: compact, grouped list of every role */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Roles"
          aria-activedescendant={`${uid}-opt-${cur.id}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
            if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
          }}
          className="space-y-5 outline-offset-4 lg:max-h-[34rem] lg:overflow-y-auto lg:pr-1"
        >
          {groups.map((g, gi) => (
            <div key={`${g.org}-${gi}`}>
              {g.org && (
                <div className="mb-2 flex items-center gap-2.5 px-1">
                  {g.logo ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--line)] bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.logo} alt="" className="h-full w-full object-contain" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--block)] text-[8px] font-bold text-white">
                      {initials(g.org)}
                    </span>
                  )}
                  <h3 className="pop-label truncate !text-[color:var(--ink)] opacity-80">{g.org}</h3>
                </div>
              )}
              <div className="space-y-1">
                {g.roles.map((r) => {
                  const kind = roleKind(r.title)
                  const live = isLive(r.meta)
                  const isSel = r.id === cur.id
                  return (
                    <button
                      key={r.id}
                      id={`${uid}-opt-${r.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      tabIndex={-1}
                      onClick={() => setSelected(r.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${
                        isSel ? 'bg-[color:var(--paper)]' : 'hover:bg-[color:var(--paper)]/60'
                      }`}
                      style={
                        isSel
                          ? { boxShadow: 'inset 3px 0 0 var(--accent), var(--shadow-sm)', border: '1px solid var(--line)' }
                          : { border: '1px solid transparent' }
                      }
                    >
                      {kind && (
                        <span title={`${kind.label} role`} className="inline-flex shrink-0">
                          <kind.icon className="h-3.5 w-3.5" style={{ color: kind.color }} aria-hidden />
                          <span className="sr-only">{kind.label} role —{' '}</span>
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm leading-snug ${isSel ? 'pop-display' : ''}`}>{r.title}</span>
                        <span className="pop-label mt-0.5 flex items-center gap-1.5 !text-[10px] opacity-70">
                          {live && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />}
                          {r.meta}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: full detail for the selected role */}
        <div className="min-w-0" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cur.id}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8 }}
              transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
              className="pop-card p-5 md:p-7"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                {cur.logo ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--line)] bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cur.logo} alt="" className="h-full w-full object-contain" />
                  </span>
                ) : (
                  cur.org && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--block)] text-[10px] font-bold text-white">
                      {initials(cur.org)}
                    </span>
                  )
                )}
                <span className="pop-label">{cur.org}</span>
              </div>

              <h3 className="pop-display mt-3 text-2xl leading-tight md:text-3xl">{cur.title}</h3>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {curKind && (
                  <span
                    className="pop-pill !text-[10px]"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: curKind.color, borderColor: curKind.color }}
                  >
                    <curKind.icon className="h-3 w-3" aria-hidden /> {curKind.label}
                  </span>
                )}
                {cur.meta && (
                  <span className="pop-pill pop-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {curLive && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />}
                    {cur.meta}
                  </span>
                )}
                {now && cur.meta && duration(cur.meta, now) && <span className="pop-label">{duration(cur.meta, now)}</span>}
              </div>

              {cur.body && <p className="mt-5 max-w-3xl whitespace-pre-line leading-relaxed">{cur.body}</p>}

              {cur.list.length > 0 && (
                <ul className="mt-4 max-w-3xl space-y-2.5">
                  {cur.list.map((pt, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: reduce ? 0 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.1 + j * 0.06 }}
                      className="flex gap-2.5 leading-relaxed"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                      {pt}
                    </motion.li>
                  ))}
                </ul>
              )}

              {cur.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {cur.tags.map((t) => (
                    <span key={t} className="pop-pill inline-flex items-center gap-1.5">
                      <TechIcon name={t} size={12} />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {(cur.detail || cur.link) && (
                <div className="mt-5 flex flex-wrap gap-4">
                  {cur.detail && <Link href={cur.detail} className="pop-link text-sm">View details →</Link>}
                  {cur.link && (
                    <a href={cur.link} target="_blank" rel="noreferrer" className="pop-link text-sm">
                      Open link <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}

              <p
                className="pop-label mt-6 !text-[10px] opacity-40"
                title="Just for fun: every role is a commit"
              >
                {shortHash(cur.id + cur.title)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
