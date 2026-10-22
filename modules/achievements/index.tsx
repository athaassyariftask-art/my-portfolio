import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { asStr, safeUrl } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Achievement = { title?: string; issuer?: string; year?: string; description?: string; url?: string }

function View({ items, detailHref }: ViewProps<Achievement>) {
  return (
    <div className="grid gap-7 md:grid-cols-2">
      {items.map((a, i) => {
        const meta = [asStr(a.issuer), asStr(a.year)].filter(Boolean).join(' · ')
        const url = safeUrl(a.url)
        const detail = detailHref(a)
        return (
          <Reveal key={i} delay={(i % 2) * 0.08}>
            <div className="pop-card pop-hover flex h-full flex-col p-7">
              {meta && <span className={`pop-pill mb-4 self-start ${popColor(i + 1)}`}>{meta}</span>}
              <h3 className="pop-display mb-2 text-2xl uppercase leading-tight">{asStr(a.title)}</h3>
              {a.description && <p className="flex-1 font-medium opacity-80">{asStr(a.description)}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                {detail && (
                  <Link href={detail} className="pop-pill pop-teal">
                    Lihat detail →
                  </Link>
                )}
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className="pop-pill inline-flex items-center gap-1">
                    Lihat bukti <ArrowUpRight className="h-3.5 w-3.5" />
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

const achievements: SectionModule<Achievement> = {
  kind: 'achievements',
  label: 'Achievement',
  description: 'Penghargaan, juara lomba, sertifikat.',
  title: 'Achievement',
  itemLabel: 'Penghargaan',
  // Mau field baru (mis. "kategori")? Tambahkan satu baris di sini, lalu tampilkan di View di atas.
  // Tidak perlu migrasi database.
  fields: [
    { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Juara 1 Lomba …' },
    { name: 'issuer', label: 'Penyelenggara', type: 'text' },
    { name: 'year', label: 'Tahun', type: 'text', placeholder: '2026' },
    { name: 'description', label: 'Deskripsi singkat', type: 'textarea' },
    { name: 'url', label: 'Link bukti / sertifikat', type: 'url', placeholder: 'https://…' },
  ],
  itemTitle: (i) => asStr(i.title),
  defaults: [],
  defaultOn: false, // ditambahkan manual lewat Admin → Section → Tambah section
  View,
}
export default achievements
