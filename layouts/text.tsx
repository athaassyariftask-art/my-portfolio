import Markdown from '@/components/Markdown'
import Reveal from '@/components/Reveal'
import { readSlots } from './slots'
import type { LayoutProps } from './types'

/** Long text (Markdown allowed) with a heading. Calm, suited to reading pages such as /about. */
export default function Text({ items, fields }: LayoutProps) {
  return (
    <div className="space-y-14">
      {items.map((item, i) => {
        const s = readSlots(item, fields)
        return (
          <Reveal key={String(item._id ?? i)}>
            {s.title && <h3 className="pop-display mb-4 text-2xl">{s.title}</h3>}
            {s.subtitle && <p className="pop-label mb-3">{s.subtitle}</p>}
            <Markdown>{s.body}</Markdown>
          </Reveal>
        )
      })}
    </div>
  )
}
