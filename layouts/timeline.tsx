import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { readSlots } from './slots'
import type { Item, LayoutProps, Slotted } from './types'

type Entry = { item: Item; s: Slotted }

/**
 * Item dengan sub-judul (organisasi) yang sama digabung jadi satu kartu, urutan kartu mengikuti
 * kemunculan pertama organisasinya. Item tanpa sub-judul tetap kartu sendiri.
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

/** Poin, tag, dan tombol milik satu entri. */
function Details({ s, detail }: { s: Slotted; detail: string | null }) {
  return (
    <>
      {s.body && <p className="mb-3 whitespace-pre-line font-medium">{s.body}</p>}
      {s.list.length > 0 && (
        <ul className="space-y-2 font-medium">
          {s.list.map((pt, j) => (
            <li key={j} className="flex gap-3">
              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full border-[1.5px] border-[#141414] bg-[color:var(--accent)]" />
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
        <div className="mt-5 flex flex-wrap gap-3">
          {detail && <Link href={detail} className="pop-pill pop-teal">Lihat detail →</Link>}
          {s.link && (
            <a href={s.link} target="_blank" rel="noreferrer" className="pop-pill inline-flex items-center gap-1">
              Buka link <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </>
  )
}

/**
 * Garis tinta tebal + lingkaran berwarna per kartu. Beberapa posisi di organisasi yang sama
 * ditumpuk dalam satu kartu dengan garis waktu kecil di dalamnya. Cocok untuk pengalaman / riwayat.
 */
export default function Timeline({ items, fields, detailHref }: LayoutProps) {
  const groups = group(items, fields)
  return (
    <div className="relative ml-3 space-y-10 border-l-[1.5px] border-[#141414] pl-9 md:ml-0 md:pl-12">
      {groups.map((g, i) => {
        const first = g[0]
        return (
          <Reveal key={String(first.item._id ?? i)}>
            <span
              className={`absolute -left-[12.75px] mt-3 h-6 w-6 rounded-full border-[1.5px] border-[#141414] ${popColor(i)}`}
            />
            <div className="pop-card p-6">
              {g.length === 1 ? (
                <>
                  {first.s.meta && <span className="pop-pill pop-yellow mb-3">{first.s.meta}</span>}
                  <h3 className="pop-display text-2xl uppercase leading-tight">{first.s.title}</h3>
                  {first.s.subtitle && <p className="mb-3 font-semibold opacity-70">{first.s.subtitle}</p>}
                  <Details s={first.s} detail={detailHref(first.item)} />
                </>
              ) : (
                <>
                  <h3 className="pop-display mb-5 text-2xl uppercase leading-tight">{first.s.subtitle}</h3>
                  <ol className="relative ml-2 space-y-8 border-l-[1.5px] border-[#141414] pl-7">
                    {g.map(({ item, s }, j) => (
                      <li key={String(item._id ?? j)} className="relative">
                        <span
                          className={`absolute -left-[36.75px] top-1.5 h-4 w-4 rounded-full border-[1.5px] border-[#141414] ${popColor(i + j + 1)}`}
                        />
                        {s.meta && <span className="pop-pill pop-yellow mb-2">{s.meta}</span>}
                        <h4 className="text-xl font-extrabold leading-snug">{s.title}</h4>
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
