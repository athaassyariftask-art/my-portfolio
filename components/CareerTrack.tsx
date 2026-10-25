'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { duration, isLive } from '@/lib/period'

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
export type TrackGroup = { org: string; roles: TrackRole[] }

/** Up to three capital letters of the organisation name, for the round badge. */
function initials(name: string): string {
  const caps = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('')
  return (caps || name.slice(0, 2)).slice(0, 3).toUpperCase()
}

/**
 * Career track: a rail that fills with colour as you scroll, an organisation badge per group, and one
 * collapsed card per role. Click a role to open its details (bullets slide in one by one); "Now" roles pulse.
 */
export default function CareerTrack({ groups }: { groups: TrackGroup[] }) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const all = groups.flatMap((g) => g.roles.map((r) => r.id))
  const [open, setOpen] = useState<Set<string>>(() => new Set(all.slice(0, 1)))
  // Durations depend on today's date, so they are filled in after mount (keeps server and browser HTML identical)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 75%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  if (all.length === 0) return null
  const allOpen = open.size === all.length

  function toggle(id: string) {
    setOpen((old) => {
      const next = new Set(old)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="pop-label">
          {all.length} role{all.length > 1 ? 's' : ''} · {groups.filter((g) => g.org).length || groups.length} organization
          {(groups.filter((g) => g.org).length || groups.length) > 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(all))}
          className="pop-btn pop-btn-ghost !px-4 !py-1.5 text-sm"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div ref={ref} className="relative">
        {/* Rail: grey line with an accent line that grows while you scroll */}
        <div aria-hidden className="absolute bottom-0 left-[13px] top-0 w-[2px] bg-[color:var(--line)] md:left-[21px]">
          <motion.div className="h-full w-full origin-top bg-[color:var(--accent)]" style={{ scaleY: reduce ? 1 : fill }} />
        </div>

        <div className="space-y-12">
          {groups.map((g, gi) => (
            <section key={`${g.org}-${gi}`} className="space-y-4">
              {g.org && (
                <div className="grid grid-cols-[28px_1fr] items-center gap-x-4 md:grid-cols-[44px_1fr] md:gap-x-6">
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center justify-self-center rounded-full bg-[color:var(--ink)] text-[9px] font-bold tracking-wide text-white md:h-11 md:w-11 md:text-xs">
                    {initials(g.org)}
                  </span>
                  <h3 className="pop-display text-xl leading-tight md:text-3xl">{g.org}</h3>
                </div>
              )}

              {g.roles.map((r) => {
                const isOpen = open.has(r.id)
                const live = isLive(r.meta)
                const dur = now && r.meta ? duration(r.meta, now) : ''
                const preview = r.body || r.list[0] || ''
                return (
                  <div key={r.id} className="grid grid-cols-[28px_1fr] gap-x-4 md:grid-cols-[44px_1fr] md:gap-x-6">
                    {/* Node on the rail */}
                    <span className="relative z-10 mt-7 flex h-3.5 w-3.5 items-center justify-center justify-self-center">
                      {live && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent)] opacity-50 motion-reduce:animate-none" />
                      )}
                      <span
                        className="relative h-3.5 w-3.5 rounded-full border-2 border-[color:var(--accent)] transition-colors duration-300"
                        style={{ backgroundColor: isOpen || live ? 'var(--accent)' : '#fff' }}
                      />
                    </span>

                    <div
                      className={`pop-card min-w-0 ${isOpen ? '' : 'pop-hover'}`}
                      // inline style: .pop-card sets these without a layer, so Tailwind utilities would lose
                      style={isOpen ? { borderColor: 'var(--ink)', boxShadow: 'var(--shadow-md)' } : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        aria-expanded={isOpen}
                        aria-controls={`${uid}-${r.id}`}
                        className="flex w-full items-start gap-4 p-5 text-left md:p-6"
                      >
                        <span className="min-w-0 flex-1">
                          {(r.meta || dur) && (
                            <span className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {r.meta && (
                                <span
                                  className="pop-pill pop-yellow"
                                  // inline style because .pop-pill (display: inline-block) beats Tailwind utilities
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                  {live && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />}
                                  {r.meta}
                                </span>
                              )}
                              {dur && <span className="pop-label">{dur}</span>}
                            </span>
                          )}
                          <span className="pop-display block text-xl leading-snug md:text-2xl">{r.title}</span>
                          {!isOpen && preview && (
                            <span className="mt-2 line-clamp-2 block max-w-4xl text-[15px] leading-relaxed text-[color:var(--muted)]">
                              {preview}
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={`mt-1 h-5 w-5 shrink-0 text-[color:var(--muted)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[color:var(--accent)]' : ''}`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="panel"
                            id={`${uid}-${r.id}`}
                            role="region"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[color:var(--line)] px-5 pb-6 pt-5 md:px-6">
                              {r.body && <p className="mb-4 max-w-4xl whitespace-pre-line leading-relaxed">{r.body}</p>}
                              {r.list.length > 0 && (
                                <ul className="max-w-4xl space-y-3">
                                  {r.list.map((pt, j) => (
                                    <motion.li
                                      key={j}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.1 + j * 0.07 }}
                                      className="flex gap-3 leading-relaxed"
                                    >
                                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                                      {pt}
                                    </motion.li>
                                  ))}
                                </ul>
                              )}
                              {r.tags.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                  {r.tags.map((t) => (
                                    <span key={t} className="pop-pill">{t}</span>
                                  ))}
                                </div>
                              )}
                              {(r.detail || r.link) && (
                                <div className="mt-5 flex flex-wrap gap-4">
                                  {r.detail && <Link href={r.detail} className="pop-link text-sm">View details →</Link>}
                                  {r.link && (
                                    <a href={r.link} target="_blank" rel="noreferrer" className="pop-link text-sm">
                                      Open link <ArrowUpRight className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
