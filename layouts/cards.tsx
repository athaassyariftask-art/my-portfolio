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

/** Kartu berwarna bergaris tebal. Bila ada gambar: gambar di atas, kartu berlatar kertas. */
export default function Cards({ items, fields, options, detailHref }: LayoutProps) {
  const cols = GRID[options.columns ?? 3] ?? GRID[3]
  return (
    <div className={`grid gap-7 ${cols}`}>
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)} delay={(i % 3) * 0.08}>
            <div
              className={`pop-card pop-hover flex h-full flex-col overflow-hidden ${s.image ? '' : popColor(i + 2)}`}
            >
              {s.image && (
                <div className={`aspect-[16/9] overflow-hidden border-b-[1.5px] border-[#141414] ${popColor(i)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-7">
                {s.meta && <span className="pop-pill mb-4 self-start bg-[#ffffff]">{s.meta}</span>}
                <h3 className="pop-display mb-1 text-2xl uppercase leading-tight">{s.title}</h3>
                {s.subtitle && <p className="mb-3 font-semibold opacity-70">{s.subtitle}</p>}
                {s.body && <p className="whitespace-pre-line font-medium">{s.body}</p>}
                {s.list.length > 0 && (
                  <ul className="mt-3 space-y-1.5 font-medium">
                    {s.list.map((pt, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full border-[1.5px] border-[#141414] bg-[#ffffff]" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                {s.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="pop-pill bg-[#ffffff]">{t}</span>
                    ))}
                  </div>
                )}
                {(detail || s.link) && (
                  <div className="mt-auto flex flex-wrap gap-3 pt-5">
                    {detail && <Link href={detail} className="pop-pill pop-teal">Lihat detail →</Link>}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="pop-pill inline-flex items-center gap-1 bg-[#ffffff]">
                        Buka link <ArrowUpRight className="h-3.5 w-3.5" />
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
