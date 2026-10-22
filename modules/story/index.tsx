import Markdown from '@/components/Markdown'
import Reveal from '@/components/Reveal'
import { asStr } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Story = { heading?: string; body?: string }

function View({ items }: ViewProps<Story>) {
  return (
    <div className="space-y-14">
      {items.map((it, i) => (
        <Reveal key={i}>
          {it.heading && <h3 className="mb-4 text-2xl font-bold text-slate-900">{asStr(it.heading)}</h3>}
          <Markdown>{asStr(it.body)}</Markdown>
        </Reveal>
      ))}
    </div>
  )
}

// Cerita panjang untuk halaman /about (bukan beranda). Satu item = satu bagian cerita.
const story: SectionModule<Story> = {
  kind: 'story',
  label: 'Cerita (halaman About)',
  description: 'Cerita detail tentang kamu, tampil di halaman /about.',
  title: 'Tentang saya',
  itemLabel: 'Bagian cerita',
  page: 'about',
  fields: [
    { name: 'heading', label: 'Judul bagian', type: 'text', placeholder: 'Latar belakang' },
    {
      name: 'body',
      label: 'Isi cerita',
      type: 'textarea',
      required: true,
      help: 'Boleh Markdown: **tebal**, *miring*, daftar dengan "- ", link [teks](https://…). Pisahkan paragraf dengan baris kosong.',
    },
  ],
  itemTitle: (i) => asStr(i.heading),
  defaults: [
    {
      heading: 'Siapa saya',
      body: 'Ceritakan tentang dirimu di sini: latar belakang, apa yang kamu kerjakan, dan apa yang kamu sukai.\n\nIsi lewat Admin → Section → Cerita.',
    },
  ],
  View,
}
export default story
