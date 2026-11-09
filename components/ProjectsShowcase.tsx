'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import BrowserFrame from '@/components/BrowserFrame'
import TechIcon from '@/components/TechIcon'

/** Plain data only: this component is a client component, so nothing here can be a function. */
export type ShowcaseProject = {
  id: number
  title: string
  summary: string
  tags: string[]
  cover: string | null
  date: string
  repo: string | null
  demo: string | null
}

const num = (i: number) => String(i + 1).padStart(2, '0')
const TILTS = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3']
const TINTS = ['pop-yellow', 'pop-blue', 'pop-teal', 'pop-pink']

/**
 * Project showcase: a list on the left, a big browser window on the right. Hovering (or tapping) a project
 * swaps the window; hovering the window tilts it and scrolls the screenshot; clicking opens the project.
 */
export default function ProjectsShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const n = projects.length
  if (n === 0) return null

  const cur = Math.min(active, n - 1)
  const p = projects[cur]

  return (
    <div className="grid items-start gap-[34px] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:gap-[55px]">
      {/* List */}
      <ol className="space-y-2">
        {projects.map((item, i) => {
          const on = i === cur
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setActive(i)
                }}
                aria-pressed={on}
                className={`flex w-full items-baseline gap-4 rounded-2xl border p-4 text-left transition-all duration-200 md:p-5 ${
                  on
                    ? 'border-[color:var(--ink)] bg-[color:var(--paper)] shadow-[var(--shadow-md)]'
                    : 'border-transparent hover:border-[color:var(--line)] hover:bg-[color-mix(in_srgb,var(--paper)_70%,transparent)]'
                }`}
              >
                <span className="pop-label">{num(i)}</span>
                <span className="pop-display flex-1 text-lg leading-snug md:text-xl">{item.title}</span>
                <ArrowUpRight
                  className={`h-5 w-5 shrink-0 transition-transform ${on ? 'rotate-45 text-[color:var(--accent)]' : 'text-[color:var(--muted)]'}`}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-3 pt-3 md:px-6">
                      <p className="text-[15px] leading-[1.65] text-[color:var(--muted)]">{item.summary}</p>
                      {item.tags.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Built with">
                          {item.tags.slice(0, 6).map((t) => (
                            <li key={t} className="inline-flex items-center gap-1.5 font-mono text-xs text-[color:var(--muted)]">
                              <TechIcon name={t} size={14} />
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link href={`/projects/${item.id}`} className="pop-btn pop-btn-ink !px-4 !py-2 text-sm">
                          Read case study <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        {item.repo && (
                          <a href={item.repo} target="_blank" rel="noreferrer" className="pop-btn pop-btn-ghost !px-4 !py-2 text-sm">
                            Source code <ArrowUpRight className="h-4 w-4" />
                          </a>
                        )}
                        {item.demo && (
                          <a href={item.demo} target="_blank" rel="noreferrer" className="pop-link text-sm">
                            Live demo →
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>

      {/* Stage */}
      <div className="relative mx-auto w-full max-w-[34rem] pb-6 lg:sticky lg:top-28 lg:max-w-none">
        {/* Layers behind the window, like a stack of files */}
        <div aria-hidden className="absolute inset-x-8 bottom-0 top-8 -rotate-2 rounded-2xl border border-[color:var(--line)] bg-[color-mix(in_srgb,var(--paper)_60%,transparent)]" />
        <div aria-hidden className="absolute inset-x-4 bottom-2 top-5 rotate-1 rounded-2xl border border-[color:var(--line)] bg-[color-mix(in_srgb,var(--paper)_80%,transparent)]" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: 'easeOut' }}
            className="relative"
          >
            <BrowserFrame src={p.cover} alt={p.title} label={p.title} href={`/projects/${p.id}`} aspect="aspect-[16/10]" />

            {/* Tags as little floating stickers */}
            {p.tags.length > 0 && (
              <div className="pointer-events-none absolute -bottom-5 left-5 flex max-w-[85%] flex-wrap gap-2">
                {p.tags.slice(0, 4).map((t, i) => (
                  <motion.span
                    key={t}
                    className={`pop-pill ${TINTS[i % TINTS.length]} ${TILTS[i % TILTS.length]} shadow-[var(--shadow-sm)]`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    animate={reduce ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                  >
                    <TechIcon name={t} size={14} />
                    {t}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="pop-label relative mt-12 flex items-center justify-between gap-4">
          <span>
            {num(cur)} / {num(n - 1)}
            {p.date ? ` · ${p.date}` : ''}
          </span>
          <span className="hidden sm:block">Hover the window to scroll through it</span>
        </p>
      </div>
    </div>
  )
}
