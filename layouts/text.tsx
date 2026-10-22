import Markdown from '@/components/Markdown'
import Reveal from '@/components/Reveal'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/** Teks panjang (boleh Markdown) dengan judul bagian. Tenang, cocok untuk halaman baca seperti /about. */
export default function Text({ items, fields }: LayoutProps) {
  return (
    <div className="space-y-14">
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        return (
          <Reveal key={String(item._id ?? i)}>
            {s.title && <h3 className="mb-4 text-2xl font-bold">{s.title}</h3>}
            {s.subtitle && <p className="mb-3 font-mono text-xs uppercase tracking-widest opacity-60">{s.subtitle}</p>}
            <Markdown>{s.body}</Markdown>
          </Reveal>
        )
      })}
    </div>
  )
}
