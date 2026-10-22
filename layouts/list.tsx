import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/** Baris-baris ringkas: label di kiri, judul + deskripsi di tengah, tombol di kanan. Cocok untuk achievement / sertifikat. */
export default function List({ items, fields, detailHref }: LayoutProps) {
  return (
    <div className="space-y-5">
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        const detail = detailHref(item)
        return (
          <Reveal key={String(item._id ?? i)}>
            <div className="pop-card pop-hover grid items-center gap-4 p-5 md:grid-cols-[8rem_1fr_auto] md:gap-6 md:p-6">
              <span className={`pop-pill justify-self-start text-center ${popColor(i + 1)}`}>{s.meta || String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="pop-display text-xl uppercase leading-tight md:text-2xl">{s.title}</h3>
                {s.subtitle && <p className="font-semibold opacity-70">{s.subtitle}</p>}
                {s.body && <p className="mt-2 whitespace-pre-line font-medium opacity-80">{s.body}</p>}
                {s.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="pop-pill bg-white">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 md:flex-col md:items-end">
                {detail && <Link href={detail} className="pop-pill pop-teal">Lihat detail →</Link>}
                {s.link && (
                  <a href={s.link} target="_blank" rel="noreferrer" className="pop-pill inline-flex items-center gap-1">
                    Buka link <ArrowUpRight className="h-3.5 w-3.5" />
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
