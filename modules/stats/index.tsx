import CountUp from '@/components/CountUp'
import Reveal from '@/components/Reveal'
import { asStr } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Stat = { value?: string; label?: string }

function View({ items, projects }: ViewProps<Stat>) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((s, i) => {
        // "auto:projects" = jumlah project yang tampil di website (selalu mutakhir)
        const raw = asStr(s.value).trim()
        const value = raw === 'auto:projects' ? String(projects.length) : raw
        return (
          <Reveal key={i} delay={i * 0.07}>
            <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <CountUp value={value} className="block text-4xl font-extrabold tracking-tight text-blue-600 md:text-5xl" />
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">{asStr(s.label)}</p>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

const stats: SectionModule<Stat> = {
  kind: 'stats',
  label: 'Statistik',
  description: 'Angka singkat (jumlah project, tahun pengalaman, dll) yang naik saat muncul.',
  title: 'Sekilas',
  itemLabel: 'Angka',
  fields: [
    {
      name: 'value',
      label: 'Angka',
      type: 'text',
      required: true,
      placeholder: '12+',
      help: 'Boleh "12", "3+", atau "auto:projects" (otomatis = jumlah project di website).',
    },
    { name: 'label', label: 'Keterangan', type: 'text', required: true, placeholder: 'Project selesai' },
  ],
  itemTitle: (i) => `${asStr(i.value)} ${asStr(i.label)}`.trim(),
  defaults: [
    { value: 'auto:projects', label: 'Project' },
    { value: '2+', label: 'Tahun pengalaman' }, // TODO ganti dengan angkamu
    { value: '3', label: 'Sertifikat' }, // TODO ganti dengan angkamu
  ],
  defaultOn: false, // tambahkan lewat Admin → Section → "Tambahkan yang belum ada"
  View,
}
export default stats
