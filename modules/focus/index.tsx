import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { asStr } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Focus = { title?: string; desc?: string }

function View({ items, detailHref }: ViewProps<Focus>) {
  return (
    <div className="grid gap-7 md:grid-cols-3">
      {items.map((f, i) => (
        <Reveal key={i} delay={i * 0.08}>
          <div className={`pop-card h-full p-7 ${popColor(i + 2)}`} style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
            <span className="pop-badge mb-6 bg-[#fff6e4]">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="pop-display mb-3 text-2xl uppercase leading-tight">{asStr(f.title)}</h3>
            <p className="font-medium">{asStr(f.desc)}</p>
            {detailHref(f) && (
              <Link href={detailHref(f)!} className="pop-pill mt-5">
                Lihat detail →
              </Link>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  )
}

const focus: SectionModule<Focus> = {
  kind: 'focus',
  label: 'Fokus',
  description: 'Kartu bidang yang kamu tekuni.',
  title: 'Fokus',
  itemLabel: 'Kartu',
  fields: [
    { name: 'title', label: 'Judul', type: 'text', required: true },
    { name: 'desc', label: 'Deskripsi', type: 'textarea' },
  ],
  itemTitle: (i) => asStr(i.title),
  defaults: [
    {
      title: 'Sistem Informasi',
      desc: 'Analisis dan perancangan sistem, serta pengembangan aplikasi web dan mobile.',
    },
    {
      title: 'Data & Business Intelligence',
      desc: 'Memakai data untuk memahami masalah dan mendukung keputusan bisnis.',
    },
    {
      title: 'Optimasi & Keputusan',
      desc: 'Metode pengambilan keputusan multikriteria dan pendekatan optimasi.',
    },
  ],
  View,
}
export default focus
