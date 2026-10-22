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

/** Grup dengan judul berwarna dan chip di dalamnya. Cocok untuk toolbox / skill. */
export default function Chips({ items, fields, options, detailHref }: LayoutProps) {
  const cols = GRID[options.columns ?? 4] ?? GRID[4]
  return (
    <div className={`grid gap-6 ${cols}`}>
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)}>
            <div className="pop-card h-full p-5">
              <span className={`pop-pill mb-4 ${popColor(i)}`}>{s.title}</span>
              {s.body && <p className="mb-3 text-sm font-medium opacity-80">{s.body}</p>}
              <div className="flex flex-wrap gap-2">
                {s.tags.map((t, j) => (
                  <span key={j} className="rounded-full border-[1.5px] border-[#141414] bg-white px-3 py-1 text-sm font-bold">
                    {t}
                  </span>
                ))}
              </div>
              {detail && <Link href={detail} className="pop-pill pop-teal mt-4">Lihat detail →</Link>}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
