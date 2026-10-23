import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/** White cards with a soft shadow. A soft tint marks the label; with an image, the image sits on top. */
export default function Cards({ items, fields, options, detailHref }: LayoutProps) {
  const cols = GRID[options.columns ?? 3] ?? GRID[3]
  return (
    <div className={`grid gap-6 ${cols}`}>
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)} delay={(i % 3) * 0.08}>
            <div className="pop-card pop-hover group relative flex h-full flex-col overflow-hidden">
              {s.image && (
                <div className={`aspect-[16/9] overflow-hidden border-b border-[color:var(--line)] ${popColor(i)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                </div>
              )}
              {!s.image && (
                <span
                  aria-hidden
                  className="pop-display pointer-events-none absolute right-5 top-2 select-none text-7xl opacity-[0.08] transition-all duration-300 group-hover:-translate-y-1 group-hover:text-[color:var(--accent)] group-hover:opacity-25"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              )}
              <div className="relative flex flex-1 flex-col p-6">
                {s.meta && <span className={`pop-pill mb-4 self-start ${popColor(i)}`}>{s.meta}</span>}
                <h3 className="pop-display text-xl leading-snug md:text-2xl">{s.title}</h3>
                {s.subtitle && <p className="mt-1 text-sm font-medium text-[color:var(--muted)]">{s.subtitle}</p>}
                {s.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{s.body}</p>}
                {s.list.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed">
                    {s.list.map((pt, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
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
                  <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5 text-sm">
                    {detail && <Link href={detail} className="pop-link">View details →</Link>}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="pop-link">
                        Open link <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
