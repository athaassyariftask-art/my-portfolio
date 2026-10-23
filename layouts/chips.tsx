import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/** Groups with a title and chips inside. Good for a toolbox / skills. */
export default function Chips({ items, fields, options, detailHref }: LayoutProps) {
  const cols = GRID[options.columns ?? 4] ?? GRID[4]
  return (
    <div className={`grid gap-5 ${cols}`}>
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)}>
            <div className="pop-card h-full p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${popColor(i)}`} style={{ border: '1px solid rgba(15,27,51,0.2)' }} />
                <h3 className="pop-display text-lg leading-snug">{s.title}</h3>
              </div>
              {s.body && <p className="mb-3 text-sm leading-relaxed text-[color:var(--muted)]">{s.body}</p>}
              <div className="flex flex-wrap gap-2">
                {s.tags.map((t, j) => (
                  <span
                    key={j}
                    className="cursor-default rounded-full border border-[color:var(--line)] bg-[color:var(--cream)] px-3 py-1 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-[color:var(--paper)] hover:text-[color:var(--accent)] hover:shadow-[var(--shadow-sm)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {detail && <Link href={detail} className="pop-link mt-4 text-sm">View details →</Link>}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
