import Link from 'next/link'
import { ArrowUpRight, Award } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/** Compact rows: label on the left, title + description in the middle, links on the right. Good for achievements / certificates. */
export default function List({ items, fields, detailHref }: LayoutProps) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)}>
            <div className="pop-card pop-hover group grid items-center gap-4 p-5 md:grid-cols-[8rem_1fr_auto] md:gap-6 md:p-6">
              <span className={`pop-pill justify-self-start text-center ${popColor(i + 1)}`}>{s.meta || String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="pop-display flex items-center gap-2.5 text-lg leading-snug md:text-xl">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--yellow)] text-[color:var(--ink)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                  >
                    <Award className="h-4 w-4" />
                  </span>
                  {s.title}
                </h3>
                {s.subtitle && <p className="text-sm font-medium text-[color:var(--muted)]">{s.subtitle}</p>}
                {s.body && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{s.body}</p>}
                {s.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="pop-pill">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:flex-col md:items-end md:gap-2">
                {detail && <Link href={detail} className="pop-link">View details →</Link>}
                {s.link && (
                  <a href={s.link} target="_blank" rel="noreferrer" className="pop-link">
                    Open link <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
