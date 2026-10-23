import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { readSlots } from './slots'
import type { Item, LayoutProps, Slotted } from './types'

type Entry = { item: Item; s: Slotted }

/** Period label; a role that is still going on ("Present" / "Now") gets a softly pulsing dot. */
function MetaPill({ text, className = '' }: { text: string; className?: string }) {
  const live = /\b(present|now|current)\b/i.test(text)
  return (
    <span
      className={`pop-pill pop-yellow ${className}`}
      // inline style because .pop-pill (display: inline-block) beats Tailwind utilities
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      {live && (
        <span aria-hidden className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent)] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
        </span>
      )}
      {text}
    </span>
  )
}

/**
 * Items that share the same subtitle (organization) are merged into one card, and cards follow the order
 * in which each organization first appears. Items without a subtitle stay as their own card.
 */
function group(items: Item[], fields: LayoutProps['fields']): Entry[][] {
  const groups: Entry[][] = []
  const byOrg = new Map<string, Entry[]>()
  for (const item of items) {
    const s = readSlots(item, fields)
    const key = s.subtitle.trim().toLowerCase()
    const entry = { item, s }
    const existing = key ? byOrg.get(key) : undefined
    if (existing) existing.push(entry)
    else {
      const g = [entry]
      groups.push(g)
      if (key) byOrg.set(key, g)
    }
  }
  return groups
}

/** Points, tags and links belonging to one entry. */
function Details({ s, detail }: { s: Slotted; detail: string | null }) {
  return (
    <>
      {s.body && <p className="mb-3 whitespace-pre-line text-[15px] leading-relaxed">{s.body}</p>}
      {s.list.length > 0 && (
        <ul className="space-y-2 text-[15px] leading-relaxed">
          {s.list.map((pt, j) => (
            <li key={j} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
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
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {detail && <Link href={detail} className="pop-link">View details →</Link>}
          {s.link && (
            <a href={s.link} target="_blank" rel="noreferrer" className="pop-link">
              Open link <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </>
  )
}

/**
 * A hairline vertical line with a ring marker per card. Several roles at the same organization are
 * stacked inside one card with a smaller timeline of their own. Good for experience / history.
 */
export default function Timeline({ items, fields, detailHref }: LayoutProps) {
  const groups = group(items, fields)
  return (
    <div className="relative ml-3 space-y-8 border-l border-[color:var(--line)] pl-9 md:ml-0 md:pl-12">
      {groups.map((g, i) => {
        const first = g[0]
        return (
          <Reveal key={String(first.item._id ?? i)}>
            <span className="absolute -left-[8px] mt-7 h-4 w-4 rounded-full border-2 border-[color:var(--accent)] bg-[color:var(--cream)]" />
            <div className="pop-card p-6">
              {g.length === 1 ? (
                <>
                  {first.s.meta && <MetaPill text={first.s.meta} className="mb-3" />}
                  <h3 className="pop-display text-xl leading-snug md:text-2xl">{first.s.title}</h3>
                  {first.s.subtitle && <p className="mb-3 mt-1 text-sm font-medium text-[color:var(--muted)]">{first.s.subtitle}</p>}
                  <Details s={first.s} detail={detailHref(first.item)} />
                </>
              ) : (
                <>
                  <h3 className="pop-display mb-5 text-xl leading-snug md:text-2xl">{first.s.subtitle}</h3>
                  <ol className="relative ml-2 space-y-8 border-l border-[color:var(--line)] pl-7">
                    {g.map(({ item, s }, j) => (
                      <li key={String(item._id ?? j)} className="relative">
                        <span className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full border-2 border-[color:var(--accent)] bg-[color:var(--paper)]" />
                        {s.meta && <MetaPill text={s.meta} className="mb-2" />}
                        <h4 className="text-lg font-semibold leading-snug">{s.title}</h4>
                        <div className="mt-2">
                          <Details s={s} detail={detailHref(item)} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
