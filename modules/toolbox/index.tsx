import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import { asList, asStr } from '../helpers'
import type { SectionModule, ViewProps } from '../types'

type Group = { group?: string; items?: string[] }

function View({ items }: ViewProps<Group>) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <Reveal key={i}>
          <div className="pop-card h-full p-5">
            <span className={`pop-pill mb-4 ${popColor(i)}`}>{asStr(s.group)}</span>
            <div className="flex flex-wrap gap-2">
              {asList(s.items).map((it, j) => (
                <span key={j} className="rounded-full border-2 border-[#141414] bg-white px-3 py-1 text-sm font-bold">
                  {it}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

const toolbox: SectionModule<Group> = {
  kind: 'toolbox',
  label: 'Toolbox',
  description: 'Skill dan tools, dikelompokkan.',
  title: 'Toolbox',
  itemLabel: 'Grup',
  fields: [
    { name: 'group', label: 'Nama grup', type: 'text', required: true, placeholder: 'Data & Backend' },
    { name: 'items', label: 'Tools', type: 'tags', help: 'Pisahkan dengan koma: Python, Django, PostgreSQL' },
  ],
  itemTitle: (i) => asStr(i.group),
  defaults: [
    { group: 'Data & Backend', items: ['Python', 'Django', 'PostgreSQL', 'Supabase'] },
    { group: 'Analisis & Keputusan', items: ['AHP', 'Analisis Data', 'Business Intelligence', 'Perancangan Sistem'] },
    { group: 'Frontend & Visual', items: ['Next.js', 'React', 'Figma', 'After Effects'] },
    { group: 'Game & Simulasi', items: ['Pygame', 'Godot'] },
  ],
  View,
}
export default toolbox
