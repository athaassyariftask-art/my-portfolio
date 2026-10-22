import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { asList, asStr } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Experience = { period?: string; title?: string; org?: string; points?: string[] }

function View({ items, detailHref }: ViewProps<Experience>) {
  return (
    // Garis tinta tebal + lingkaran berwarna per periode
    <div className="relative ml-3 space-y-10 border-l-[3px] border-[#141414] pl-9 md:ml-0 md:pl-12">
      {items.map((e, i) => (
        <Reveal key={i}>
          <span
            className={`absolute -left-[13px] mt-3 h-6 w-6 rounded-full border-[3px] border-[#141414] ${popColor(i)}`}
          />
          <div className="pop-card p-6">
            <span className="pop-pill pop-yellow mb-3">{asStr(e.period)}</span>
            <h3 className="pop-display text-2xl uppercase leading-tight">{asStr(e.title)}</h3>
            <p className="mb-4 font-semibold opacity-70">{asStr(e.org)}</p>
            <ul className="space-y-2 font-medium">
              {asList(e.points).map((pt, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full border-2 border-[#141414] bg-[color:var(--orange)]" />
                  {pt}
                </li>
              ))}
            </ul>
            {detailHref(e) && (
              <Link href={detailHref(e)!} className="pop-pill pop-teal mt-5">
                Lihat detail →
              </Link>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  )
}

const experience: SectionModule<Experience> = {
  kind: 'experience',
  label: 'Pengalaman',
  description: 'Riwayat pengalaman, urut dari yang paling atas.',
  title: 'Pengalaman',
  itemLabel: 'Pengalaman',
  fields: [
    { name: 'period', label: 'Periode', type: 'text', placeholder: '2025 — Sekarang' },
    { name: 'title', label: 'Posisi', type: 'text', required: true },
    { name: 'org', label: 'Organisasi', type: 'text' },
    { name: 'points', label: 'Poin tugas', type: 'lines', help: 'Satu baris = satu poin.' },
  ],
  itemTitle: (i) => asStr(i.title),
  defaults: [
    {
      period: '20XX — Sekarang', // TODO
      title: 'Asisten Laboratorium LOSIK',
      org: 'Lab. Optimasi, Sistem Informasi, dan Pendukung Keputusan, Teknik Industri UB',
      points: [
        'Mengajar praktikum dan membimbing praktikan.',
        'Koordinator Praktikum Analisis dan Perancangan Sistem.',
      ],
    },
  ],
  View,
}
export default experience
